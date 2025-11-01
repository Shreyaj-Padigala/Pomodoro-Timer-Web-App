from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, StudySession
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///study_sessions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# API Routes

@app.route('/api/sessions/start', methods=['POST'])
def start_session():
    """Start a new study session"""
    data = request.get_json()
    
    if not data or 'session_name' not in data:
        return jsonify({'error': 'session_name is required'}), 400
    
    new_session = StudySession(
        session_name=data['session_name'],
        start_time=datetime.utcnow()
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify(new_session.to_dict()), 201

@app.route('/api/sessions/<int:session_id>/update', methods=['PUT'])
def update_session(session_id):
    """Update session notes and pomodoro count"""
    session = StudySession.query.get_or_404(session_id)
    data = request.get_json()
    
    if 'notes' in data:
        session.notes = data['notes']
    
    if 'pomodoros_completed' in data:
        session.pomodoros_completed = data['pomodoros_completed']
    
    if 'pomodoros_interrupted' in data:
        session.pomodoros_interrupted = data['pomodoros_interrupted']
    
    session.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(session.to_dict()), 200

@app.route('/api/sessions/<int:session_id>/complete', methods=['POST'])
def complete_session(session_id):
    """Mark session as complete"""
    session = StudySession.query.get_or_404(session_id)
    data = request.get_json()
    
    session.end_time = datetime.utcnow()
    
    if 'total_duration' in data:
        session.total_duration = data['total_duration']
    
    if 'notes' in data:
        session.notes = data['notes']
    
    if 'pomodoros_completed' in data:
        session.pomodoros_completed = data['pomodoros_completed']
    
    db.session.commit()
    
    return jsonify(session.to_dict()), 200

@app.route('/api/sessions', methods=['GET'])
def get_all_sessions():
    """Get all study sessions"""
    sessions = StudySession.query.order_by(StudySession.created_at.desc()).all()
    return jsonify([session.to_dict() for session in sessions]), 200

@app.route('/api/sessions/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Get specific session details"""
    session = StudySession.query.get_or_404(session_id)
    return jsonify(session.to_dict()), 200

@app.route('/api/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a study session"""
    session = StudySession.query.get_or_404(session_id)
    db.session.delete(session)
    db.session.commit()
    return jsonify({'message': 'Session deleted successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
