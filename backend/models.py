from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class StudySession(db.Model):
    """Model for storing study session data"""
    
    __tablename__ = 'study_sessions'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Session details
    session_name = db.Column(db.String(200), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    total_duration = db.Column(db.Integer, default=0)
    
    # Pomodoro tracking
    pomodoros_completed = db.Column(db.Integer, default=0)
    pomodoros_interrupted = db.Column(db.Integer, default=0)
    
    # Notes taken during session
    notes = db.Column(db.Text, default="")
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert session object to dictionary for JSON responses"""
        return {
            'id': self.id,
            'session_name': self.session_name,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'total_duration': self.total_duration,
            'pomodoros_completed': self.pomodoros_completed,
            'pomodoros_interrupted': self.pomodoros_interrupted,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<StudySession {self.id}: {self.session_name}>'
