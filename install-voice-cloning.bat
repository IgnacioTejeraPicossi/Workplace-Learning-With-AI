@echo off
chcp 65001 >nul

echo 🎤 Installing Voice Cloning Backend...
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed.
    echo Please install Python 3.8 or higher and try again.
    pause
    exit /b 1
)

echo ✅ Python detected

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv voice_cloning_env

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call voice_cloning_env\Scripts\activate.bat

REM Upgrade pip
echo ⬆️ Upgrading pip...
python -m pip install --upgrade pip

REM Install PyTorch
echo 🔥 Installing PyTorch...
python -m pip install torch torchaudio

REM Install Coqui TTS
echo 🎤 Installing Coqui TTS...
python -m pip install coqui-tts

REM Install additional dependencies
echo 📚 Installing additional dependencies...
python -m pip install -r backend\requirements-voice-cloning.txt

REM Create necessary directories
echo 📁 Creating directories...
if not exist "backend\voice_models" mkdir backend\voice_models
if not exist "backend\voice_audio" mkdir backend\voice_audio

REM Test installation
echo 🧪 Testing installation...
python -c "from TTS.api import TTS; print('✅ Coqui TTS imported successfully')"
if errorlevel 1 (
    echo ❌ Coqui TTS import failed
    pause
    exit /b 1
)

python -c "import torch; print(f'✅ PyTorch {torch.__version__} imported successfully')"
if errorlevel 1 (
    echo ❌ PyTorch import failed
    pause
    exit /b 1
)

echo.
echo 🎉 Voice Cloning Backend installed successfully!
echo.
echo 📋 Next steps:
echo 1. Activate the virtual environment: voice_cloning_env\Scripts\activate.bat
echo 2. Start the backend: cd backend ^&^& python app.py
echo 3. The voice cloning API will be available at http://localhost:8000
echo.
echo 🔗 API Endpoints:
echo - POST /voice-cloning/upload-sample - Upload voice sample
echo - POST /voice-cloning/train - Train voice model
echo - GET /voice-cloning/training-status/{id} - Check training status
echo - POST /voice-cloning/synthesize - Synthesize speech
echo - GET /voice-cloning/user-models/{user_id} - Get user models
echo - DELETE /voice-cloning/user-models/{user_id} - Delete model
echo.
pause 