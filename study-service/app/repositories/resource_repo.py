from sqlalchemy.orm import Session
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate
from typing import List

def create_resource(db: Session, resource_in: ResourceCreate, group_id: int, user_id: int) -> Resource:
    db_resource = Resource(
        group_id=group_id,
        uploaded_by=user_id,
        **resource_in.model_dump()
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def get_resources_by_group(db: Session, group_id: int) -> List[Resource]:
    return db.query(Resource).filter(Resource.group_id == group_id).all()

def get_resource_by_id(db: Session, resource_id: int) -> Resource:
    return db.query(Resource).filter(Resource.id == resource_id).first()

def delete_resource(db: Session, db_resource: Resource):
    db.delete(db_resource)
    db.commit()
