# Humanoid Adapter - Interface for humanoid robot control
from typing import Dict
import asyncio
import random

# Allowed command types for safety
ALLOWED_COMMANDS = {
    "move", "grip_open", "grip_close", "home", "stop", 
    "pause", "resume", "emergency_stop", "status_check"
}

async def send_command(cmd: Dict) -> bool:
    """
    Send command to humanoid robot (mock implementation)
    In real implementation, this would interface with robot hardware
    """
    try:
        # Validate command
        if not _validate_command(cmd):
            return False
        
        # Simulate command processing delay
        await asyncio.sleep(0.1)
        
        # Mock command execution
        success = _execute_mock_command(cmd)
        
        # Log command (in real implementation, this would go to robot logs)
        _log_command(cmd, success)
        
        return success
        
    except Exception as e:
        print(f"⚠️ Command execution failed: {e}")
        return False

def _validate_command(cmd: Dict) -> bool:
    """Validate command before execution"""
    if not isinstance(cmd, dict):
        return False
    
    cmd_type = cmd.get("type", "")
    if cmd_type not in ALLOWED_COMMANDS:
        print(f"❌ Invalid command type: {cmd_type}")
        return False
    
    # Check for dry run requirement (safety measure)
    if not cmd.get("dry_run", False):
        print("❌ Only dry_run commands allowed in mock mode")
        return False
    
    # Validate command-specific parameters
    if cmd_type == "move":
        return _validate_move_command(cmd)
    elif cmd_type in ["grip_open", "grip_close"]:
        return _validate_grip_command(cmd)
    elif cmd_type == "home":
        return _validate_home_command(cmd)
    elif cmd_type in ["stop", "pause", "resume", "emergency_stop"]:
        return True  # No additional parameters needed
    elif cmd_type == "status_check":
        return True  # No additional parameters needed
    
    return True

def _validate_move_command(cmd: Dict) -> bool:
    """Validate move command parameters"""
    args = cmd.get("args", {})
    
    # Check for required position parameters
    required_params = ["x", "y", "z"]
    for param in required_params:
        if param not in args:
            print(f"❌ Missing required parameter: {param}")
            return False
        
        if not isinstance(args[param], (int, float)):
            print(f"❌ Invalid parameter type for {param}")
            return False
    
    # Check for reasonable position values
    x, y, z = args["x"], args["y"], args["z"]
    if not (0 <= x <= 2.0 and 0 <= y <= 2.0 and 0 <= z <= 2.0):
        print("❌ Position values out of safe range (0-2m)")
        return False
    
    return True

def _validate_grip_command(cmd: Dict) -> bool:
    """Validate grip command parameters"""
    args = cmd.get("args", {})
    
    # Check for force parameter if provided
    if "force" in args:
        force = args["force"]
        if not isinstance(force, (int, float)) or not (0 <= force <= 100):
            print("❌ Invalid force value (0-100)")
            return False
    
    return True

def _validate_home_command(cmd: Dict) -> bool:
    """Validate home command parameters"""
    # Home command doesn't require additional parameters
    return True

def _execute_mock_command(cmd: Dict) -> bool:
    """Execute the command in mock mode"""
    cmd_type = cmd.get("type", "")
    
    # Simulate occasional failures for realism
    if random.random() < 0.05:  # 5% failure rate
        print(f"⚠️ Mock command failed: {cmd_type}")
        return False
    
    # Simulate command-specific behavior
    if cmd_type == "move":
        return _mock_move_execution(cmd)
    elif cmd_type in ["grip_open", "grip_close"]:
        return _mock_grip_execution(cmd)
    elif cmd_type == "home":
        return _mock_home_execution(cmd)
    elif cmd_type in ["stop", "pause", "resume"]:
        return _mock_control_execution(cmd)
    elif cmd_type == "emergency_stop":
        return _mock_emergency_stop(cmd)
    elif cmd_type == "status_check":
        return _mock_status_check(cmd)
    
    return True

def _mock_move_execution(cmd: Dict) -> bool:
    """Mock move command execution"""
    args = cmd.get("args", {})
    x, y, z = args.get("x", 0), args.get("y", 0), args.get("z", 0)
    
    print(f"🤖 Mock: Moving to position ({x}, {y}, {z})")
    return True

def _mock_grip_execution(cmd: Dict) -> bool:
    """Mock grip command execution"""
    cmd_type = cmd.get("type", "")
    args = cmd.get("args", {})
    force = args.get("force", 50)
    
    action = "opening" if "open" in cmd_type else "closing"
    print(f"🤖 Mock: Grip {action} with force {force}%")
    return True

def _mock_home_execution(cmd: Dict) -> bool:
    """Mock home command execution"""
    print("🤖 Mock: Returning to home position")
    return True

def _mock_control_execution(cmd: Dict) -> bool:
    """Mock control command execution"""
    cmd_type = cmd.get("type", "")
    action_map = {
        "stop": "stopping",
        "pause": "pausing",
        "resume": "resuming"
    }
    action = action_map.get(cmd_type, cmd_type)
    print(f"🤖 Mock: {action.capitalize()} robot")
    return True

def _mock_emergency_stop(cmd: Dict) -> bool:
    """Mock emergency stop execution"""
    print("🚨 Mock: EMERGENCY STOP activated")
    return True

def _mock_status_check(cmd: Dict) -> bool:
    """Mock status check execution"""
    print("🤖 Mock: Status check - All systems operational")
    return True

def _log_command(cmd: Dict, success: bool) -> None:
    """Log command execution (mock)"""
    status = "SUCCESS" if success else "FAILED"
    cmd_type = cmd.get("type", "unknown")
    timestamp = asyncio.get_event_loop().time()
    
    # In real implementation, this would write to robot logs
    print(f"📝 [{timestamp:.2f}] {cmd_type}: {status}")

# Additional utility functions for real implementation
async def get_robot_status() -> Dict:
    """Get current robot status (mock)"""
    return {
        "status": "operational",
        "battery_level": random.uniform(0.7, 1.0),
        "position": {
            "x": random.uniform(0, 2),
            "y": random.uniform(0, 2),
            "z": random.uniform(0, 1.5)
        },
        "gripper_state": "open",
        "temperature": random.uniform(20, 35),
        "error_count": random.randint(0, 2)
    }

async def calibrate_robot() -> bool:
    """Calibrate robot systems (mock)"""
    print("🔧 Mock: Calibrating robot systems...")
    await asyncio.sleep(1.0)  # Simulate calibration time
    print("✅ Mock: Calibration complete")
    return True

async def reset_robot() -> bool:
    """Reset robot to safe state (mock)"""
    print("🔄 Mock: Resetting robot to safe state...")
    await asyncio.sleep(0.5)
    print("✅ Mock: Robot reset complete")
    return True
