"""On-demand export endpoints — download app data as CSV or JSON."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth import require_admin
from backend import export as ex

router = APIRouter(prefix="/api/export", tags=["export"])


def _filename(dataset: str, fmt: str) -> str:
    from datetime import date
    return f"farm-{dataset}-{date.today().isoformat()}.{fmt}"


@router.get("/{dataset}")
def export_dataset(
    dataset: str,
    _user: Annotated[dict, Depends(require_admin)],
    db: Session = Depends(get_db),
    format: str = Query("csv", pattern="^(csv|json)$"),
):
    if dataset == "all":
        if format == "csv":
            raise HTTPException(status_code=400, detail="Use format=json for the full backup")
        payload = ex.to_json(ex.full_backup(db))
        return Response(
            content=payload,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{_filename("backup", "json")}"'},
        )

    if dataset not in ex.DATASETS:
        raise HTTPException(status_code=404, detail=f"Unknown dataset: {dataset}")

    data_fn, fields = ex.DATASETS[dataset]
    rows = data_fn(db)

    if format == "json":
        return Response(
            content=ex.to_json(rows),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{_filename(dataset, "json")}"'},
        )

    return Response(
        content=ex.to_csv(rows, fields),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{_filename(dataset, "csv")}"'},
    )
