from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.connection import Base


class TaskResult(Base):
    __tablename__ = "task_results"
    
    id = Column(String(256), primary_key=True)
    task_id = Column(String(256), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(512), nullable=True)
    file_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
