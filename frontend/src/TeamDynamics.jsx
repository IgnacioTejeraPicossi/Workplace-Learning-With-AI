import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { getTeams, createTeam, generateTeamAnalytics } from "./api";

function TeamDynamics() {
  const [teams, setTeams] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    members: []
  });
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const { colors } = useTheme();

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await getTeams();
      setTeams(response.teams || []);
    } catch (error) {
      console.error("Error loading teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.description.trim()) return;
    
    try {
      setLoading(true);
      const response = await createTeam({
        name: newTeam.name,
        description: newTeam.description,
        members: newTeam.members
      });
      
      setTeams([...teams, { ...newTeam, id: response.team_id }]);
      setNewTeam({ name: "", description: "", members: [] });
      setShowCreateTeam(false);
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalytics = async (teamId) => {
    try {
      setLoading(true);
      const response = await generateTeamAnalytics(teamId);
      
      setAnalytics(prev => ({
        ...prev,
        [teamId]: response.analysis
      }));
    } catch (error) {
      console.error("Error generating analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMemberToTeam = () => {
    const member = {
      name: "",
      role: "",
      email: "",
      skills: []
    };
    setNewTeam(prev => ({
      ...prev,
      members: [...prev.members, member]
    }));
  };

  const updateMember = (index, field, value) => {
    setNewTeam(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const removeMember = (index) => {
    setNewTeam(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text, marginBottom: 24 }}>Team Dynamics Analyzer</h2>
      
      {/* Team Creation Section */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24, 
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ color: colors.text, marginTop: 0 }}>Create or Join Teams</h3>
        
        {!showCreateTeam ? (
          <button
            onClick={() => setShowCreateTeam(true)}
            title="Create a new team with members, roles, and skills. Set up team structure for collaborative learning and AI-powered analytics."
            style={{
              background: colors.buttonPrimary,
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 1px 4px #0001"
            }}
          >
            + Create New Team
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Team name..."
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              />
              <input
                type="text"
                value={newTeam.description}
                onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Team description..."
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              />
            </div>

            {/* Team Members */}
            <div>
              <h4 style={{ color: colors.text, marginBottom: 12 }}>Team Members</h4>
              {newTeam.members.map((member, index) => (
                <div key={index} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr auto", 
                  gap: 12, 
                  marginBottom: 12,
                  alignItems: "center"
                }}>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(index, "name", e.target.value)}
                    placeholder="Name"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.cardBackground,
                      color: colors.text,
                      fontSize: 14
                    }}
                  />
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => updateMember(index, "role", e.target.value)}
                    placeholder="Role"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.cardBackground,
                      color: colors.text,
                      fontSize: 14
                    }}
                  />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateMember(index, "email", e.target.value)}
                    placeholder="Email"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.cardBackground,
                      color: colors.text,
                      fontSize: 14
                    }}
                  />
                  <button
                    onClick={() => removeMember(index)}
                    style={{
                      background: colors.buttonDanger,
                      color: "#fff",
                      border: 0,
                      borderRadius: 6,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addMemberToTeam}
                style={{
                  background: colors.buttonSecondary,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                + Add Member
              </button>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleCreateTeam}
                disabled={loading}
                style={{
                  background: colors.buttonSuccess,
                  color: "#fff",
                  border: 0,
                  borderRadius: 6,
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
              <button
                onClick={() => setShowCreateTeam(false)}
                style={{
                  background: colors.cardBackground,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Teams List */}
      {teams.length > 0 && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24, 
          boxShadow: colors.shadow,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Your Teams</h3>
          
          {teams.map((team) => (
            <div key={team._id} style={{ 
              marginBottom: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ color: colors.text, margin: 0 }}>{team.name}</h4>
                <span style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {team.member_count || 0} members
                </span>
              </div>
              
              <p style={{ color: colors.textSecondary, marginBottom: 16 }}>
                {team.description}
              </p>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => handleGenerateAnalytics(team._id)}
                  disabled={loading}
                  style={{
                    background: colors.buttonPrimary,
                    color: "#fff",
                    border: 0,
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? "Analyzing..." : "Generate Analytics"}
                </button>
                <button
                  style={{
                    background: colors.cardBackground,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 14
                  }}
                >
                  View Details
                </button>
              </div>
              
              {/* Analytics Results */}
              {analytics[team._id] && (
                <div style={{ 
                  marginTop: 16, 
                  padding: 16, 
                  background: colors.cardBackground, 
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`
                }}>
                  <h5 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>AI Analysis</h5>
                  <div style={{ 
                    color: colors.textSecondary, 
                    fontSize: 14, 
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap"
                  }}>
                    {analytics[team._id]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Team Collaboration Features */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: 24, 
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ color: colors.text, marginTop: 0 }}>Collaborative Learning</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>
          Analyze team dynamics and get AI-powered recommendations for team-based learning paths.
        </p>
        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            title="Launch interactive team scenarios and role-playing exercises. Practice team collaboration, conflict resolution, and leadership skills in a safe environment."
            style={{
              background: colors.buttonPrimary,
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            Start Team Simulation
          </button>
          <button
            title="View detailed team performance metrics, collaboration patterns, and AI-generated insights. Track team progress and identify areas for improvement."
            style={{
              background: colors.cardBackground,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            View Team Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamDynamics; 