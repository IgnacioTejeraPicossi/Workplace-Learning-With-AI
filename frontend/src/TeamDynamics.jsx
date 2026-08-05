import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import { getTeams, createTeam, generateTeamAnalytics, getTeam, getTeamAnalyticsHistory } from "./api";
import { auth } from "./firebase";

function TeamDynamics() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState({});
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    members: []
  });
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [showAnalyticsOverview, setShowAnalyticsOverview] = useState(false);
  const [analyticsOverview, setAnalyticsOverview] = useState({}); // teamId → { teamName, latest, count }
  const { colors } = useTheme();

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      setTeams([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getTeams();
      setTeams(response.teams || []);
    } catch (error) {
      console.error("Error loading teams:", error);
      if (error.response?.status === 401) {
        setTeams([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      alert(t("teamDynamics.alerts.signInToCreate"));
      return;
    }

    if (!newTeam.name.trim() || !newTeam.description.trim()) {
      alert(t("teamDynamics.alerts.fillNameDescription"));
      return;
    }
    
    // Validate members
    const validMembers = newTeam.members.filter(member => 
      member.name.trim() && member.role.trim() && member.email.trim()
    );
    
    if (validMembers.length === 0) {
      alert(t("teamDynamics.alerts.addMember"));
      return;
    }
    
    // Check for duplicate emails
    const emails = validMembers.map(member => member.email.toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      alert(t("teamDynamics.alerts.duplicateEmails"));
      return;
    }
    
    
    try {
      setLoading(true);
      const response = await createTeam({
        name: newTeam.name.trim(),
        description: newTeam.description.trim(),
        members: validMembers
      });
      
      
      // Reload teams to get the updated list
      await loadTeams();
      
      setNewTeam({ name: "", description: "", members: [] });
      setShowCreateTeam(false);
      alert(t("teamDynamics.alerts.teamCreated"));
    } catch (error) {
      console.error("Error creating team:", error);
      if (error.response?.data?.detail) {
        alert(t("teamDynamics.alerts.errorPrefix", { detail: error.response.data.detail }));
      } else {
        alert(t("teamDynamics.alerts.createTeamFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalytics = async (teamId) => {
    try {
      setLoading(true);
      const response = await generateTeamAnalytics(teamId, ["collaboration", "productivity", "communication"]);

      setAnalytics(prev => ({
        ...prev,
        [teamId]: { text: response.analysis || "", isMock: !!response.is_mock }
      }));
    } catch (error) {
      console.error("Error generating analytics:", error);
      alert(t("teamDynamics.alerts.analyticsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (teamId) => {
    try {
      setLoading(true);
      const response = await getTeam(teamId);
      setTeamDetails(prev => ({
        ...prev,
        [teamId]: response.team
      }));
      setSelectedTeam(teamId);
    } catch (error) {
      console.error("Error loading team details:", error);
      alert(t("teamDynamics.alerts.detailsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartTeamSimulation = () => {
    if (!auth.currentUser) {
      alert(t("teamDynamics.alerts.signInSimulation"));
      return;
    }
    // Open the Scenario Simulator module (team-oriented practice scenarios).
    window.dispatchEvent(new CustomEvent('navigateToModule', { detail: { module: 'simulations' } }));
  };

  const handleViewTeamAnalytics = async () => {
    if (!auth.currentUser) {
      alert(t("teamDynamics.alerts.signInAnalytics"));
      return;
    }

    if (teams.length === 0) {
      alert(t("teamDynamics.alerts.noTeamsAnalytics"));
      return;
    }

    // Toggle off if already open
    if (showAnalyticsOverview) {
      setShowAnalyticsOverview(false);
      return;
    }

    // Aggregate overview: the latest real saved analysis per team (historical
    // endpoint GET /teams/{id}/analytics). Mock/empty entries are skipped.
    try {
      setLoading(true);
      const entries = await Promise.all(teams.map(async (team) => {
        try {
          const res = await getTeamAnalyticsHistory(team._id);
          const list = res.analytics || [];
          const latest = list.find(a => a.analysis && !a.is_mock) || null;
          return [team._id, { teamName: team.name, latest, count: list.length }];
        } catch {
          return [team._id, { teamName: team.name, latest: null, count: 0 }];
        }
      }));
      setAnalyticsOverview(Object.fromEntries(entries));
      setShowAnalyticsOverview(true);
    } catch (error) {
      console.error("Error loading analytics overview:", error);
      alert(t("teamDynamics.alerts.analyticsFailed"));
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

  const updateMemberSkills = (index, skillsString) => {
    // Convert comma-separated skills string to array
    const skills = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill);
    setNewTeam(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, skills } : member
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
      <h2 style={{ color: colors.text, marginBottom: 24 }}>{t("teamDynamics.pageTitle")}</h2>

      {!auth.currentUser && (
        <div style={{ 
          background: colors.buttonDanger, 
          color: "#fff", 
          padding: "12px", 
          borderRadius: "8px", 
          marginBottom: "16px",
          textAlign: "center"
        }}>
          ⚠️ {t("teamDynamics.signInBanner")}
        </div>
      )}

      {auth.currentUser && (
        <div style={{ 
          background: colors.buttonSuccess, 
          color: "#fff", 
          padding: "8px 12px", 
          borderRadius: "6px", 
          marginBottom: "16px",
          fontSize: "14px"
        }}>
          {t("teamDynamics.signedInAs", { email: auth.currentUser.email })}
        </div>
      )}
      
      {/* Team Creation Section */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24, 
        boxShadow: colors.shadow,
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ color: colors.text, marginTop: 0 }}>{t("teamDynamics.sectionCreateOrJoin")}</h3>

        {!showCreateTeam ? (
          <button
            onClick={() => setShowCreateTeam(true)}
            title={t("teamDynamics.createNewTeamTooltip")}
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
            {t("teamDynamics.createNewTeam")}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("teamDynamics.placeholderTeamName")}
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
                placeholder={t("teamDynamics.placeholderTeamDescription")}
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
              <h4 style={{ color: colors.text, marginBottom: 12 }}>{t("teamDynamics.teamMembers")}</h4>
              {newTeam.members.map((member, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: 8, 
                  marginBottom: 16,
                  padding: 16,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: colors.background
                }}>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr 1fr auto", 
                    gap: 12, 
                    alignItems: "center"
                  }}>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(index, "name", e.target.value)}
                      placeholder={t("teamDynamics.placeholderName")}
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
                      placeholder={t("teamDynamics.placeholderRole")}
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
                      placeholder={t("teamDynamics.placeholderEmail")}
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
                      {t("teamDynamics.remove")}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={member.skills.join(', ')}
                    onChange={(e) => updateMemberSkills(index, e.target.value)}
                    placeholder={t("teamDynamics.placeholderSkills")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.cardBackground,
                      color: colors.text,
                      fontSize: 14
                    }}
                  />
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
                {t("teamDynamics.addMember")}
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
                {loading ? t("teamDynamics.creating") : t("teamDynamics.createTeam")}
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
                {t("teamDynamics.cancel")}
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
          <h3 style={{ color: colors.text, marginTop: 0 }}>{t("teamDynamics.yourTeams")}</h3>
          
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
                  {t("teamDynamics.membersCount", { count: team.member_count || 0 })}
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
                  {loading ? t("teamDynamics.analyzing") : t("teamDynamics.generateAnalytics")}
                </button>
                                 <button
                   onClick={() => handleViewDetails(team._id)}
                   disabled={loading}
                   style={{
                     background: colors.cardBackground,
                     color: colors.text,
                     border: `1px solid ${colors.border}`,
                     borderRadius: 6,
                     padding: "8px 16px",
                     cursor: loading ? "not-allowed" : "pointer",
                     fontSize: 14,
                     opacity: loading ? 0.6 : 1
                   }}
                 >
                   {loading ? t("teamDynamics.loading") : t("teamDynamics.viewDetails")}
                 </button>
              </div>
              
                             {/* Team Details */}
               {selectedTeam === team._id && teamDetails[team._id] && (
                 <div style={{ 
                   marginTop: 16, 
                   padding: 16, 
                   background: colors.cardBackground, 
                   borderRadius: 8,
                   border: `1px solid ${colors.border}`
                 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                     <h5 style={{ color: colors.text, margin: 0 }}>{t("teamDynamics.teamMembersHeading")}</h5>
                     <button
                       onClick={() => setSelectedTeam(null)}
                       style={{
                         background: colors.buttonDanger,
                         color: "#fff",
                         border: 0,
                         borderRadius: 4,
                         padding: "4px 8px",
                         cursor: "pointer",
                         fontSize: 12
                       }}
                     >
                       {t("teamDynamics.close")}
                     </button>
                   </div>
                   {teamDetails[team._id].members && teamDetails[team._id].members.length > 0 ? (
                     <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                       {teamDetails[team._id].members.map((member, index) => (
                         <div key={index} style={{ 
                           padding: 12, 
                           background: colors.background, 
                           borderRadius: 6,
                           border: `1px solid ${colors.border}`
                         }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                             <strong style={{ color: colors.text }}>{member.name}</strong>
                             <span style={{ color: colors.textSecondary, fontSize: 12 }}>{member.role}</span>
                           </div>
                           <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                             📧 {member.email}
                           </div>
                           {member.skills && member.skills.length > 0 && (
                             <div style={{ color: colors.textSecondary, fontSize: 12 }}>
                               🛠️ {t("teamDynamics.skillsLabel")} {member.skills.join(", ")}
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p style={{ color: colors.textSecondary, fontSize: 14 }}>{t("teamDynamics.noMembersFound")}</p>
                   )}
                 </div>
               )}
               
               {/* Analytics Results */}
               {analytics[team._id] && (
                 <div style={{ 
                   marginTop: 16, 
                   padding: 16, 
                   background: colors.cardBackground, 
                   borderRadius: 8,
                   border: `1px solid ${colors.border}`
                 }}>
                   <h5 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>{t("teamDynamics.aiAnalysis")}</h5>
                   {analytics[team._id].isMock ? (
                     <div style={{ color: colors.textSecondary, fontSize: 14, fontStyle: "italic" }}>
                       ⚠️ {t("teamDynamics.analyticsOfflineNotice")}
                     </div>
                   ) : (
                     <div style={{
                       color: colors.textSecondary,
                       fontSize: 14,
                       lineHeight: 1.5,
                       whiteSpace: "pre-wrap"
                     }}>
                       {analytics[team._id].text}
                     </div>
                   )}
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
        <h3 style={{ color: colors.text, marginTop: 0 }}>{t("teamDynamics.collaborativeLearning")}</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>
          {t("teamDynamics.collaborativeLearningDesc")}
        </p>

                 <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
           <button
             onClick={handleStartTeamSimulation}
             title={t("teamDynamics.startTeamSimulationTooltip")}
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
             {t("teamDynamics.startTeamSimulation")}
           </button>
                     <button
             onClick={handleViewTeamAnalytics}
             title={t("teamDynamics.viewTeamAnalyticsTooltip")}
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
             {t("teamDynamics.viewTeamAnalytics")}
           </button>
        </div>
      </div>

      {/* Team Analytics Overview — aggregate of the latest saved analysis per team */}
      {showAnalyticsOverview && (
        <div style={{
          background: colors.cardBackground,
          borderRadius: 12,
          padding: 24,
          marginTop: 24,
          boxShadow: colors.shadow,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: colors.text, margin: 0 }}>{t("teamDynamics.analyticsOverviewTitle")}</h3>
            <button
              onClick={() => setShowAnalyticsOverview(false)}
              style={{
                background: colors.buttonDanger, color: "#fff", border: 0,
                borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12
              }}
            >
              {t("teamDynamics.close")}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {teams.map((team) => {
              const ov = analyticsOverview[team._id] || {};
              return (
                <div key={team._id} style={{
                  padding: 16, background: colors.background, borderRadius: 8,
                  border: `1px solid ${colors.border}`
                }}>
                  <h4 style={{ color: colors.text, margin: "0 0 8px 0" }}>{team.name}</h4>
                  {ov.latest ? (
                    <div style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {ov.latest.analysis}
                    </div>
                  ) : (
                    <p style={{ color: colors.textSecondary, fontSize: 14, fontStyle: "italic", margin: 0 }}>
                      {t("teamDynamics.noAnalysisYet")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDynamics;