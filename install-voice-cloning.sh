#!/bin/bash

# Voice Cloning Installation Script
# This script installs all dependencies for the voice cloning backend

echo "🎤 Installing Voice Cloning Backend..."
echo "======================================"

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
if [ -z "$python_version" ]; then
    echo "❌ Python 3.8+ is required but not installed."
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi

echo "✅ Python $python_version detected"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv voice_cloning_env

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source voice_cloning_env/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install PyTorch first (for CUDA support if available)
echo "🔥 Installing PyTorch..."
if command -v nvidia-smi &> /dev/null; then
    echo "🚀 CUDA detected - installing PyTorch with CUDA support"
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
else
    echo "💻 Installing PyTorch CPU version"
    pip install torch torchaudio
fi

# Install Coqui TTS
echo "🎤 Installing Coqui TTS..."
pip install coqui-tts

# Install additional dependencies
echo "📚 Installing additional dependencies..."
pip install -r backend/requirements-voice-cloning.txt

# Install system dependencies (Ubuntu/Debian)
if command -v apt-get &> /dev/null; then
    echo "🔧 Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y espeak-ng ffmpeg
fi

# Install system dependencies (macOS)
if command -v brew &> /dev/null; then
    echo "🍺 Installing system dependencies via Homebrew..."
    brew install espeak ffmpeg
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/voice_models
mkdir -p backend/voice_audio

# Test installation
echo "🧪 Testing installation..."
python3 -c "
try:
    from TTS.api import TTS
    print('✅ Coqui TTS imported successfully')
except ImportError as e:
    print(f'❌ Coqui TTS import failed: {e}')
    exit(1)

try:
    import torch
    print(f'✅ PyTorch {torch.__version__} imported successfully')
    if torch.cuda.is_available():
        print(f'🚀 CUDA available: {torch.cuda.get_device_name(0)}')
    else:
        print('💻 Using CPU for PyTorch')
except ImportError as e:
    print(f'❌ PyTorch import failed: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Voice Cloning Backend installed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Activate the virtual environment: source voice_cloning_env/bin/activate"
    echo "2. Start the backend: cd backend && python app.py"
    echo "3. The voice cloning API will be available at http://localhost:8000"
    echo ""
    echo "🔗 API Endpoints:"
    echo "- POST /voice-cloning/upload-sample - Upload voice sample"
    echo "- POST /voice-cloning/train - Train voice model"
    echo "- GET /voice-cloning/training-status/{id} - Check training status"
    echo "- POST /voice-cloning/synthesize - Synthesize speech"
    echo "- GET /voice-cloning/user-models/{user_id} - Get user models"
    echo "- DELETE /voice-cloning/user-models/{user_id} - Delete model"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi 