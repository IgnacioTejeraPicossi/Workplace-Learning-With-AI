from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from bson import ObjectId
from db import (
    repo_analyses_collection,
    repo_documentation_collection,
    repo_quizzes_collection,
    repo_learning_paths_collection
)

class RepoStorage:
    """Handle storage and retrieval of repository analysis data"""
    
    @staticmethod
    async def save_repo_analysis(
        repo_url: str,
        repo_name: str,
        branch_used: str,
        analysis_data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> str:
        """Save repository analysis to database"""
        try:
            analysis_doc = {
                "repo_url": repo_url,
                "repo_name": repo_name,
                "branch_used": branch_used,
                "analysis_data": analysis_data,
                "user_id": user_id,
                            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
                "status": "completed"
            }
            
            result = await repo_analyses_collection.insert_one(analysis_doc)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving repo analysis: {e}")
            raise
    
    @staticmethod
    async def save_documentation(
        analysis_id: str,
        documentation_data: Dict[str, Any],
        format_type: str = "markdown"
    ) -> str:
        """Save generated documentation"""
        try:
            doc_data = {
                "analysis_id": ObjectId(analysis_id),
                "documentation": documentation_data,
                "format_type": format_type,
                "created_at": datetime.utcnow()
            }
            
            result = await repo_documentation_collection.insert_one(doc_data)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving documentation: {e}")
            raise
    
    @staticmethod
    async def save_quiz(
        analysis_id: str,
        quiz_data: Dict[str, Any],
        difficulty: str = "medium"
    ) -> str:
        """Save generated quiz"""
        try:
            quiz_doc = {
                "analysis_id": ObjectId(analysis_id),
                "quiz_data": quiz_data,
                "difficulty": difficulty,
                "created_at": datetime.utcnow()
            }
            
            result = await repo_quizzes_collection.insert_one(quiz_doc)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving quiz: {e}")
            raise
    
    @staticmethod
    async def save_learning_path(
        analysis_id: str,
        learning_path_data: Dict[str, Any]
    ) -> str:
        """Save learning path recommendations"""
        try:
            path_doc = {
                "analysis_id": ObjectId(analysis_id),
                "learning_path": learning_path_data,
                "created_at": datetime.utcnow()
            }
            
            result = await repo_learning_paths_collection.insert_one(path_doc)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving learning path: {e}")
            raise
    
    @staticmethod
    async def get_repo_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get repository analysis by ID"""
        try:
            analysis = await repo_analyses_collection.find_one({"_id": ObjectId(analysis_id)})
            if analysis:
                analysis["_id"] = str(analysis["_id"])
                analysis["analysis_id"] = str(analysis["_id"])
            return analysis
            
        except Exception as e:
            print(f"Error getting repo analysis: {e}")
            return None
    
    @staticmethod
    async def get_user_analyses(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all analyses for a user"""
        try:
            cursor = repo_analyses_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            analyses = []
            async for analysis in cursor:
                # Convert MongoDB document to dict and add analysis_id field
                analysis_dict = dict(analysis)
                analysis_dict["analysis_id"] = str(analysis["_id"])
                analysis_dict["_id"] = str(analysis["_id"])
                analyses.append(analysis_dict)
            
            return analyses
            
        except Exception as e:
            print(f"Error getting user analyses: {e}")
            return []
    
    @staticmethod
    async def get_recent_analyses(limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent analyses (for all users)"""
        try:
            cursor = repo_analyses_collection.find().sort("created_at", -1).limit(limit)
            
            analyses = []
            async for analysis in cursor:
                # Convert MongoDB document to dict and add analysis_id field
                analysis_dict = dict(analysis)
                analysis_dict["analysis_id"] = str(analysis["_id"])
                analysis_dict["_id"] = str(analysis["_id"])
                analyses.append(analysis_dict)
            
            return analyses
            
        except Exception as e:
            print(f"Error getting recent analyses: {e}")
            return []
    
    @staticmethod
    async def get_analysis_with_documentation(analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis with its associated documentation"""
        try:
            analysis = await repo_analyses_collection.find_one({"_id": ObjectId(analysis_id)})
            if not analysis:
                return None
            
            # Get documentation
            documentation = await repo_documentation_collection.find_one(
                {"analysis_id": ObjectId(analysis_id)}
            )
            
            # Get quiz
            quiz = await repo_quizzes_collection.find_one(
                {"analysis_id": ObjectId(analysis_id)}
            )
            
            # Get learning path
            learning_path = await repo_learning_paths_collection.find_one(
                {"analysis_id": ObjectId(analysis_id)}
            )
            
            result = {
                "analysis": analysis,
                "documentation": documentation,
                "quiz": quiz,
                "learning_path": learning_path
            }
            
            # Convert ObjectIds to strings and add analysis_id field
            if result["analysis"]:
                result["analysis"]["_id"] = str(result["analysis"]["_id"])
                result["analysis"]["analysis_id"] = str(result["analysis"]["_id"])
            if result["documentation"]:
                result["documentation"]["_id"] = str(result["documentation"]["_id"])
            if result["quiz"]:
                result["quiz"]["_id"] = str(result["quiz"]["_id"])
            if result["learning_path"]:
                result["learning_path"]["_id"] = str(result["learning_path"]["_id"])
            
            return result
            
        except Exception as e:
            print(f"Error getting analysis with documentation: {e}")
            return None
    
    @staticmethod
    async def delete_analysis(analysis_id: str) -> bool:
        """Delete analysis and all associated data"""
        try:
            # Delete analysis
            await repo_analyses_collection.delete_one({"_id": ObjectId(analysis_id)})
            
            # Delete associated documentation
            await repo_documentation_collection.delete_many({"analysis_id": ObjectId(analysis_id)})
            
            # Delete associated quiz
            await repo_quizzes_collection.delete_many({"analysis_id": ObjectId(analysis_id)})
            
            # Delete associated learning path
            await repo_learning_paths_collection.delete_many({"analysis_id": ObjectId(analysis_id)})
            
            return True
            
        except Exception as e:
            print(f"Error deleting analysis: {e}")
            return False
    
    @staticmethod
    async def update_analysis_status(analysis_id: str, status: str) -> bool:
        """Update analysis status"""
        try:
            await repo_analyses_collection.update_one(
                {"_id": ObjectId(analysis_id)},
                {
                    "$set": {
                        "status": status,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            return True
            
        except Exception as e:
            print(f"Error updating analysis status: {e}")
            return False

    @staticmethod
    async def cleanup_old_analyses(days_old: int = 30) -> int:
        """Clean up analyses older than specified days"""
        try:
            from datetime import timedelta
            
            # Calculate cutoff date
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            # Find old analyses
            old_analyses = await repo_analyses_collection.find({
                "created_at": {"$lt": cutoff_date}
            }).to_list(length=None)
            
            deleted_count = 0
            
            # Delete each old analysis and its associated data
            for analysis in old_analyses:
                analysis_id = str(analysis["_id"])
                try:
                    success = await RepoStorage.delete_analysis(analysis_id)
                    if success:
                        deleted_count += 1
                        print(f"Deleted old analysis: {analysis_id}")
                    else:
                        print(f"Failed to delete old analysis: {analysis_id}")
                except Exception as e:
                    print(f"Error deleting old analysis {analysis_id}: {e}")
                    continue
            
            print(f"Cleanup completed. Deleted {deleted_count} old analyses.")
            return deleted_count
            
        except Exception as e:
            print(f"Error during cleanup: {e}")
            return 0 