# Robomind Clinic - Machine Psychology Module
# Based on Psychopathia Machinalis framework

from .models import Finding, CaseIntake, DiagnosisReport
from .detectors import REGISTRY
from .judge import llm_meta_eval
from .service import diagnose_case, get_therapy_patches
from .router import router

__version__ = "0.1.0"
__all__ = [
    "Finding",
    "CaseIntake", 
    "DiagnosisReport",
    "REGISTRY",
    "llm_meta_eval",
    "diagnose_case",
    "get_therapy_patches",
    "router"
]
