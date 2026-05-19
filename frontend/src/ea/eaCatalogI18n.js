/** Maps English DB values to stable i18n slugs under enterpriseArchitectureModule.catalog */
export const CATALOG_KEYS = {
  applications: {
    'Enterprise Architecture Module': 'enterpriseArchitectureModule',
    'Repository Analyzer Module': 'repositoryAnalyzerModule',
    'Test App': 'testApp',
    'Workplace Learning With AI': 'workplaceLearningWithAI',
    'ERP System': 'erpSystem',
    'CRM Platform': 'crmPlatform',
    'Legacy Database': 'legacyDatabase',
  },
  processes: {
    'Repository Analysis Process': 'repositoryAnalysisProcess',
    'AI Content Generation Process': 'aiContentGenerationProcess',
    'User Onboarding Process': 'userOnboardingProcess',
    'Test Process': 'testProcess',
    'Order Processing': 'orderProcessing',
    'Payment Processing': 'paymentProcessing',
    'User Authentication': 'userAuthentication',
  },
  capabilities: {
    'Financial Management': 'financialManagement',
    'Inventory Control': 'inventoryControl',
    'HR Management': 'hrManagement',
    'Lead Management': 'leadManagement',
    'Customer Analytics': 'customerAnalytics',
    'Campaign Management': 'campaignManagement',
    'Data Storage': 'dataStorage',
    'Data Retrieval': 'dataRetrieval',
    'Customer Management': 'customerManagement',
    'Financial Operations': 'financialOperations',
    'IT Infrastructure': 'itInfrastructure',
    'Order Management': 'orderManagement',
    'Risk Management': 'riskManagement',
  },
  dataClasses: {
    'Process Data': 'processData',
    'Application Data': 'applicationData',
    'Capability Data': 'capabilityData',
    'Code Data': 'codeData',
    'Documentation Data': 'documentationData',
    'Quiz Data': 'quizData',
    'Test Data': 'testData',
    'User Data': 'userData',
    'Learning Data': 'learningData',
    'Analytics Data': 'analyticsData',
    'Repository Data': 'repositoryData',
    'Financial Data': 'financialData',
    'Employee Data': 'employeeData',
    'Inventory Data': 'inventoryData',
    'Customer Data': 'customerData',
    'Sales Data': 'salesData',
    'Marketing Data': 'marketingData',
    'Historical Data': 'historicalData',
    'Reference Data': 'referenceData',
  },
  vendors: {
    'Test Vendor': 'testVendor',
  },
  owners: {
    'Development Team': 'developmentTeam',
    'AI Team': 'aiTeam',
  },
};

export function createEaCatalogTranslators(t) {
  const tEntity = (group, value, field) => {
    if (!value) return value;
    const slug = CATALOG_KEYS[group]?.[value];
    if (!slug) return value;
    return t(`enterpriseArchitectureModule.catalog.${group}.${slug}.${field}`, { defaultValue: value });
  };

  const tLabel = (group, value) => {
    if (!value) return value;
    const slug = CATALOG_KEYS[group]?.[value];
    if (!slug) return value;
    return t(`enterpriseArchitectureModule.catalog.${group}.${slug}`, { defaultValue: value });
  };

  return {
    tAppName: (name) => tEntity('applications', name, 'name'),
    tAppDesc: (name, desc) => {
      const slug = CATALOG_KEYS.applications[name];
      if (!slug) return desc;
      return t(`enterpriseArchitectureModule.catalog.applications.${slug}.description`, { defaultValue: desc });
    },
    tProcessName: (name) => tEntity('processes', name, 'name'),
    tProcessDesc: (name, desc) => {
      const slug = CATALOG_KEYS.processes[name];
      if (!slug) return desc;
      return t(`enterpriseArchitectureModule.catalog.processes.${slug}.description`, { defaultValue: desc });
    },
    tCapName: (name) => tEntity('capabilities', name, 'name'),
    tCapDesc: (name, desc) => {
      const slug = CATALOG_KEYS.capabilities[name];
      if (!slug) return desc;
      return t(`enterpriseArchitectureModule.catalog.capabilities.${slug}.description`, { defaultValue: desc });
    },
    tDataClass: (value) => tLabel('dataClasses', value),
    tCapabilityName: (value) => tEntity('capabilities', value, 'name'),
    tVendor: (value) => tLabel('vendors', value),
    tOwner: (value) => tLabel('owners', value),
  };
}
