import os
from typing import Optional

class EnvConfig:
    """
    Configuration management for environment variables
    """
    
    @staticmethod
    def get_cursor_ai_key() -> Optional[str]:
        """Get Cursor AI API key from environment"""
        return os.getenv('CURSOR_AI_API_KEY')
    
    @staticmethod
    def get_openai_key() -> Optional[str]:
        """Get OpenAI API key from environment"""
        return os.getenv('OPENAI_API_KEY')
    
    @staticmethod
    def get_mongo_uri() -> str:
        """Get MongoDB URI from environment"""
        return os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    
    @staticmethod
    def get_firebase_credentials() -> str:
        """Get Firebase credentials path from environment"""
        return os.getenv('FIREBASE_CREDENTIALS', 'serviceAccountKey.json')
    
    @staticmethod
    def is_cursor_ai_available() -> bool:
        """Check if Cursor AI is available"""
        return bool(EnvConfig.get_cursor_ai_key())
    
    @staticmethod
    def is_openai_available() -> bool:
        """Check if OpenAI is available"""
        return bool(EnvConfig.get_openai_key())
    
    @staticmethod
    def get_analysis_preference() -> str:
        """Get analysis preference: 'cursor_ai' or 'openai'"""
        if EnvConfig.is_cursor_ai_available():
            return 'cursor_ai'
        elif EnvConfig.is_openai_available():
            return 'openai'
        else:
            return 'none'
    
    @staticmethod
    def get_cursor_ai_base_url() -> str:
        """Get Cursor AI base URL"""
        return os.getenv('CURSOR_AI_BASE_URL', 'https://api.cursor.sh/v1')
    
    @staticmethod
    def get_analysis_timeout() -> int:
        """Get analysis timeout in seconds"""
        return int(os.getenv('ANALYSIS_TIMEOUT', '300'))  # 5 minutes default
    
    @staticmethod
    def get_max_file_size() -> int:
        """Get maximum file size for analysis in bytes"""
        return int(os.getenv('MAX_FILE_SIZE', '1048576'))  # 1MB default
    
    @staticmethod
    def get_max_files_per_analysis() -> int:
        """Get maximum number of files per analysis"""
        return int(os.getenv('MAX_FILES_PER_ANALYSIS', '1000'))
    
    @staticmethod
    def get_quality_threshold() -> float:
        """Get quality threshold for analysis"""
        return float(os.getenv('QUALITY_THRESHOLD', '0.7'))
    
    @staticmethod
    def is_debug_mode() -> bool:
        """Check if debug mode is enabled"""
        return os.getenv('DEBUG_MODE', 'false').lower() == 'true'
    
    @staticmethod
    def get_log_level() -> str:
        """Get log level"""
        return os.getenv('LOG_LEVEL', 'INFO') 