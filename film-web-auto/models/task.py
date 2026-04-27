from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from database.connection import Base


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(256), primary_key=True)
    request_id = Column(String(256), nullable=True, index=True)
    workspace = Column(String(64), nullable=True, index=True)
    data_id = Column(String(256), nullable=True, index=True)
    type = Column(String(32), nullable=True)
    desc = Column(String(512), nullable=True)
    status = Column(String(32), nullable=True, index=True)
    system = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "request_id": self.request_id,
            "workspace": self.workspace,
            "data_id": self.data_id,
            "type": self.type,
            "desc": self.desc,
            "status": self.status,
            "system": self.system,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
