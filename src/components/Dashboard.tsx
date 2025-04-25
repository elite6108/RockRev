import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  FolderOpen,
  Wallet,
  Settings,
  Plus,
  ArrowRight,
  Building2,
  Users,
  FileText,
  User,
  FileCheck,
  HardHat,
  ClipboardCheck,
  Receipt,
  FileWarning,
  AlertTriangle,
  FileSpreadsheet,
  ShieldAlert,
  Truck,
  Wrench,
  Menu,
  X,
  Users2,
  ListTodo,
  Calendar as CalendarIcon,
  Briefcase,
  ChevronLeft,
  Moon,
  Sun,
} from 'lucide-react';
import { PurchaseOrderForm } from './PurchaseOrders/PurchaseOrderForm';
import { ProjectForm } from './Projects/ProjectForm';
import { ProjectsList } from './Projects/ProjectsList';
import { SuppliersList } from './PurchaseOrders/SuppliersList';
import { CustomersList } from './Customers/CustomersList';
import { CustomerForm } from './Customers/CustomerForm';
import { PurchaseOrdersList } from './PurchaseOrders/PurchaseOrdersList';
import { QuotesList } from './Quotes/QuotesList';
import { QuoteForm } from './Quotes/QuoteForm';
import { CompanySettingsForm } from './CompanySettings/CompanySettingsForm';
import { QuoteTerms } from './Quotes/QuoteTerms';
import { RAMS } from './HealthSafety/RAMS/RAMS';
import { CPP } from './HealthSafety/CPP/CPP';
import { PaymentInfo } from './Quotes/PaymentInfo';
import { HSToolboxTalks } from './HealthSafety/ToolboxTalks/HSToolboxTalks';
import { HSAccidents } from './HealthSafety/Accidents/HSAccidents';
import { HSPolicies } from './HealthSafety/Policies/HSPolicies';
import { HSSignage } from './HealthSafety/Signage/HSSignage';
import { HSVehicles } from './HealthSafety/Vehicles/HSVehicles';
import { HSEquipment } from './HealthSafety/Equipment/HSEquipment';
import { Staff } from './Admin/Staff';
import { Tasks } from './Admin/Tasks';
import { Calendar } from './Admin/Calendar';
import { Subcontractors } from './Admin/Subcontractors';
import { ModulesModal } from './Settings/ModulesModal';
import { RiskAssessmentForm } from './HealthSafety/RiskAssessments/RiskAssessmentForm';
import { RiskAssessmentsubpage } from './HealthSafety/RiskAssessments/RiskAssessmentsubpage';
import { HSOrganisationChart } from './HealthSafety/OrganisationChart/HSOrganisationChart';
import { SiteLists } from './Projects/SiteLists';
import { Workers } from './Projects/Workers';
import { LeadManagement } from './Quotes/LeadManagement';
import { DisplayScreenAssessment } from './HealthSafety/DSE/DisplayScreenAssessment';
import type {
  PurchaseOrder,
  Project,
  Supplier,
  Customer,
  Quote,
} from '../types/database';

interface DashboardProps {
  selectedProjectId: string | null;
}

export function Dashboard({ selectedProjectId }: DashboardProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCompanySettingsModal, setShowCompanySettingsModal] =
    useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showProjectsList, setShowProjectsList] = useState(false);
  const [showSuppliersList, setShowSuppliersList] = useState(false);
  const [showCustomersList, setShowCustomersList] = useState(false);
  const [showPurchaseOrdersList, setShowPurchaseOrdersList] = useState(false);
  const [showQuotesList, setShowQuotesList] = useState(false);
  const [showQuoteTerms, setShowQuoteTerms] = useState(false);
  const [showRAMS, setShowRAMS] = useState(false);
  const [showCPP, setShowCPP] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [showToolboxTalks, setShowToolboxTalks] = useState(false);
  const [showAccidents, setShowAccidents] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showSignage, setShowSignage] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSubcontractors, setShowSubcontractors] = useState(false);
  const [showOrganisationChart, setShowOrganisationChart] = useState(false);
  const [showSitesList, setShowSitesList] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [companyName, setCompanyName] = useState('ON POINT GROUNDWORK');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [modules, setModules] = useState({
    admin: true,
    customersAndProjects: true,
    purchaseOrders: true,
    quotes: true,
    healthAndSafety: true,
  });
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'error'
  >('checking');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLeadManagement, setShowLeadManagement] = useState(false);
  const [showDSE, setShowDSE] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  const predefinedNames = ['Colin', 'Connor', 'Mason', 'Robert', 'Richard'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchData();
    fetchUserProfile();
    fetchCompanyName();
    checkConnection();

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    return () => clearInterval(timer);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) {
        setSelectedName(user.user_metadata.display_name);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCompanyName = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('name')
        .limit(1)
        .single();

      if (error) throw error;
      if (data?.name) {
        setCompanyName(data.name);
      }
    } catch (err) {
      console.error('Error fetching company name:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [
        ordersResponse,
        projectsResponse,
        suppliersResponse,
        customersResponse,
        quotesResponse,
      ] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select(
            `
            *,
            project:projects(name)
          `
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('customers')
          .select('*')
          .order('customer_name', { ascending: true }),
        supabase
          .from('quotes')
          .select(
            `
            *,
            customer:customers(customer_name, company_name)
          `
          )
          .order('created_at', { ascending: false }),
      ]);

      if (ordersResponse.error) throw ordersResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;
      if (suppliersResponse.error) throw suppliersResponse.error;
      if (customersResponse.error) throw customersResponse.error;
      if (quotesResponse.error) throw quotesResponse.error;

      setOrders(ordersResponse.data || []);
      setProjects(projectsResponse.data || []);
      setSuppliers(suppliersResponse.data || []);
      setCustomers(customersResponse.data || []);
      setQuotes(quotesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNameUpdate = async () => {
    setNameError(null);
    setNameSuccess(false);
    setLoadingName(true);

    try {
      if (!selectedName) {
        setNameError('Please select a name');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { display_name: selectedName },
      });

      if (error) throw error;

      setNameSuccess(true);
      setTimeout(() => {
        setNameSuccess(false);
      }, 2000);
    } catch (error) {
      setNameError(
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      setLoadingName(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'An error occurred'
      );
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalAmount = orders.reduce(
    (sum, order) => sum + (order.amount || 0),
    0
  );

  const resetView = () => {
    setShowProjectsList(false);
    setShowSuppliersList(false);
    setShowCustomersList(false);
    setShowPurchaseOrdersList(false);
    setShowQuotesList(false);
    setShowQuoteTerms(false);
    setShowRAMS(false);
    setShowCPP(false);
    setShowPaymentInfo(false);
    setShowToolboxTalks(false);
    setShowAccidents(false);
    setShowPolicies(false);
    setShowSignage(false);
    setShowVehicles(false);
    setShowEquipment(false);
    setShowStaff(false);
    setShowTasks(false);
    setShowCalendar(false);
    setShowSubcontractors(false);
    setShowOrganisationChart(false);
    setShowSitesList(false);
    setShowWorkers(false);
    setShowLeadManagement(false);
    setShowDSE(false);

  };

  const handleModuleChange = (module: keyof typeof modules, value: boolean) => {
    setModules((prev) => ({ ...prev, [module]: value }));
  };

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
  };

  const handleBackToDashboard = () => {
    setActiveSection(null);
    resetView();
  };

  const checkConnection = async () => {
    try {
      // Check if we can connect to Supabase
      const { data: healthCheck, error: healthError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1);

      if (healthError) throw healthError;

      // Check essential tables
      const tableChecks = await Promise.all([
        supabase.from('tasks').select('id').limit(1),
        supabase.from('projects').select('id').limit(1),
        supabase.from('customers').select('id').limit(1),
        supabase.from('suppliers').select('id').limit(1),
        supabase.from('quotes').select('id').limit(1),
        supabase.from('purchase_orders').select('id').limit(1),
      ]);

      // Check if any of the table queries returned an error
      const hasErrors = tableChecks.some((check) => check.error);

      setConnectionStatus(hasErrors ? 'error' : 'connected');
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            {/* Logo Section - Left */}
            <button
              onClick={resetView}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            >
              <img src="/opg-logo.svg" alt="OPG Logo" className="h-6 w-6" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{companyName} | CRM</h1>
            </button>

            {/* Mobile Icons - Right */}
            <div className="flex items-center space-x-4 md:hidden">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <button
                onClick={toggleDarkMode}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </button>
                {isNewMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => {
                          setShowProjectModal(true);
                          setIsNewMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <Plus className="h-4 w-4 inline mr-2" />
                        New Project
                      </button>
                      <button
                        onClick={() => {
                          setShowPurchaseOrderModal(true);
                          setIsNewMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <Plus className="h-4 w-4 inline mr-2" />
                        New Purchase Order
                      </button>
                      <button
                        onClick={() => {
                          setShowQuoteModal(true);
                          setIsNewMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <Plus className="h-4 w-4 inline mr-2" />
                        New Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowCompanySettingsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#DC2626] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="space-y-2 py-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </button>

                <button
                  onClick={() => {
                    setShowCompanySettingsModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>

                <button
                  onClick={() => {
                    setShowProjectModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </button>

                <button
                  onClick={() => {
                    setShowPurchaseOrderModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </button>

                <button
                  onClick={() => {
                    setShowQuoteModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Quote
                </button>

                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {showLeadManagement ? (
              <LeadManagement onBack={resetView} />
            ) : showSitesList ? (
              <SiteLists onBack={resetView} />
            ) : showStaff ? (
              <Staff onBack={resetView} />
            ) : showTasks ? (
              <Tasks onBack={resetView} />
            ) : showCalendar ? (
              <Calendar onBack={resetView} />
            ) : showSubcontractors ? (
              <Subcontractors onBack={resetView} />
            ) : showProjectsList ? (
              <ProjectsList
                projects={projects}
                onProjectChange={fetchData}
                onBack={resetView}
              />
            ) : showSuppliersList ? (
              <SuppliersList
                suppliers={suppliers}
                onSupplierChange={fetchData}
                onBack={resetView}
              />
            ) : showCustomersList ? (
              <CustomersList
                customers={customers}
                onCustomerChange={fetchData}
                onBack={resetView}
              />
            ) : showPurchaseOrdersList ? (
              <PurchaseOrdersList
                orders={orders}
                onOrderChange={fetchData}
                onBack={resetView}
              />
            ) : showQuotesList ? (
              <QuotesList
                quotes={quotes}
                onQuoteChange={fetchData}
                onBack={resetView}
              />
            ) : showQuoteTerms ? (
              <QuoteTerms onBack={resetView} />
            ) : showRAMS ? (
              <RAMS onBack={resetView} />
            ) : showCPP ? (
              <CPP onBack={resetView} />
            ) : showPaymentInfo ? (
              <PaymentInfo onBack={resetView} />
            ) : showToolboxTalks ? (
              <HSToolboxTalks onBack={resetView} />
            ) : showAccidents ? (
              <HSAccidents onBack={resetView} />
            ) : showPolicies ? (
              <HSPolicies onBack={resetView} />
            ) : showSignage ? (
              <HSSignage onBack={resetView} />
            ) : showVehicles ? (
              <HSVehicles onBack={resetView} />
            ) : showEquipment ? (
              <HSEquipment onBack={resetView} />
            ) : showOrganisationChart ? (
              <HSOrganisationChart onBack={resetView} />
            ) : showWorkers ? (
              <Workers onBack={resetView} />
            ) : showDSE ? (
              <DisplayScreenAssessment onBack={resetView} />
            ) : (
              <div className="space-y-6">
                {/* Breadcrumb Navigation */}
                {activeSection && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-white mb-6">
                    <button
                      onClick={handleBackToDashboard}
                      className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-gray-200"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back to Dashboard
                    </button>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white font-medium capitalize">
                      {activeSection}
                    </span>
                  </div>
                )}

                {/* Main Category Cards - Only show when no section is active */}
                {!activeSection && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Admin Card */}
                    {modules.admin && (
                      <button
                        onClick={() => handleSectionClick('admin')}
                        className={`bg-white dark:bg-[#1F2937] overflow-hidden shadow rounded-lg transition-transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-[rgb(79,70,229)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          activeSection === 'admin'
                            ? 'ring-2 ring-indigo-500'
                            : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <Users2 className="h-8 w-8 text-gray-400 dark:text-white flex-shrink-0" />
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-left">
                                Admin
                              </h3>
                              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-left bullets">
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Staff Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Task Tracking</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Calendar</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Sub Contractors</span>
                                </li>
                              </ul>
                            </div>
                            <ArrowRight
                              className={`h-5 w-5 text-gray-400 dark:text-white transform transition-transform ${
                                activeSection === 'admin' ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Customers & Projects Card */}
                    {modules.customersAndProjects && (
                      <button
                        onClick={() => handleSectionClick('customers')}
                        className={`bg-white dark:bg-[#1F2937] overflow-hidden shadow rounded-lg transition-transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-[rgb(79,70,229)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          activeSection === 'customers'
                            ? 'ring-2 ring-indigo-500'
                            : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <Users className="h-8 w-8 text-gray-400 dark:text-white flex-shrink-0" />
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-left">
                                Customers & Projects
                              </h3>
                              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-left bullets">
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Customer List</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Project Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Site Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Worker Management</span>
                                </li>
                              </ul>
                            </div>
                            <ArrowRight
                              className={`h-5 w-5 text-gray-400 dark:text-white transform transition-transform ${
                                activeSection === 'customers' ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Purchase Orders Card */}
                    {modules.purchaseOrders && (
                      <button
                        onClick={() => handleSectionClick('purchase')}
                        className={`bg-white dark:bg-[#1F2937] overflow-hidden shadow rounded-lg transition-transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-[rgb(79,70,229)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          activeSection === 'purchase'
                            ? 'ring-2 ring-indigo-500'
                            : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <FileText className="h-8 w-8 text-gray-400 dark:text-white flex-shrink-0" />
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-left">
                                Purchase Orders
                              </h3>
                              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-left bullets">
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Supplier Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Create Purchase Orders</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Edit Purchase Orders</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Purchase Order Amounts</span>
                                </li>
                              </ul>
                            </div>
                            <ArrowRight
                              className={`h-5 w-5 text-gray-400 dark:text-white transform transition-transform ${
                                activeSection === 'purchase' ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Quotes Card */}
                    {modules.quotes && (
                      <button
                        onClick={() => handleSectionClick('quotes')}
                        className={`bg-white dark:bg-[#1F2937] overflow-hidden shadow rounded-lg transition-transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-[rgb(79,70,229)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          activeSection === 'quotes'
                            ? 'ring-2 ring-indigo-500'
                            : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <FileCheck className="h-8 w-8 text-gray-400 dark:text-white flex-shrink-0" />
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-left">
                                Quotes
                              </h3>
                              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-left bullets">
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Quote Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Lead Management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Terms & Conditions</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Payment Information</span>
                                </li>
                              </ul>
                            </div>
                            <ArrowRight
                              className={`h-5 w-5 text-gray-400 dark:text-white transform transition-transform ${
                                activeSection === 'quotes' ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Health & Safety Card */}
                    {modules.healthAndSafety && (
                      <button
                        onClick={() => handleSectionClick('health')}
                        className={`bg-white dark:bg-[#1F2937] overflow-hidden shadow rounded-lg transition-transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-[rgb(79,70,229)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          activeSection === 'health'
                            ? 'ring-2 ring-indigo-500'
                            : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <HardHat className="h-8 w-8 text-gray-400 dark:text-white flex-shrink-0" />
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-left">
                                Health & Safety
                              </h3>
                              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-left bullets">
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>HS Policy & Other Policies</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>RAMS & Risk Assessment</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Toolbox Talks</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>Vehicle & Equipment</span>
                                </li>
                              </ul>
                            </div>
                            <ArrowRight
                              className={`h-5 w-5 text-gray-400 dark:text-white transform transition-transform ${
                                activeSection === 'health' ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Section Widgets - Show in full page when section is active */}
                {activeSection === 'admin' && modules.admin && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Admin Section
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <button
                        onClick={() => setShowStaff(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Users2 className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Staff
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowTasks(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <ListTodo className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Tasks
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowCalendar(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <CalendarIcon className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Calendar
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                  
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowSubcontractors(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Briefcase className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Sub Contractors
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 'customers' &&
                  modules.customersAndProjects && (
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        Customers & Projects Section
                      </h2>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                        <button
                          onClick={() => setShowCustomersList(true)}
                          className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <Users className="h-6 w-6 text-gray-400" />
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-500">
                                    Customers
                                  </div>
                                  <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                    {customers.length}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setShowProjectsList(true)}
                          className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <FolderOpen className="h-6 w-6 text-gray-400" />
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-500">
                                    Projects
                                  </div>
                                  <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                    {projects.length}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setShowWorkers(true)}
                          className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <Users2 className="h-6 w-6 text-gray-400" />
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-500">
                                    Workers
                                  </div>
                                  <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setShowSitesList(true)}
                          className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <Building2 className="h-6 w-6 text-gray-400" />
                                <div className="ml-5">
                                  <div className="text-sm font-medium text-gray-500">
                                    Sites
                                  </div>
                                  <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                    
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                {activeSection === 'purchase' && modules.purchaseOrders && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Purchase Orders Section
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <button
                        onClick={() => setShowSuppliersList(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Building2 className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Suppliers
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                  {suppliers.length}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowPurchaseOrdersList(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileText className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Purchase Orders
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                  {orders.length}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <div className="bg-[#ffe6e8] dark:bg-[rgb(109,0,0)] overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Wallet className="h-6 w-6 text-gray-400 dark:text-white" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500 dark:text-white">
                                  Total Amount
                                </div>
                                <div className="text-lg font-medium text-gray-900 dark:text-white mt-1 text-left">
                                  £{formatNumber(totalAmount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'quotes' && modules.quotes && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Quotes Section
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <button
                        onClick={() => setShowQuotesList(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileText className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Total Quotes
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                  {quotes.length}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowLeadManagement(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Users className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Lead Management
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowQuoteTerms(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileCheck className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Quote Terms
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowPaymentInfo(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Receipt className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Payment Terms
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 'health' && modules.healthAndSafety && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Health & Safety Section
                    </h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <button
                        onClick={() => setShowPolicies(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileWarning className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Policies
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowRAMS(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <HardHat className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  RAMS & RA
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowCPP(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <ClipboardCheck className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  CPP
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowToolboxTalks(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileSpreadsheet className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Toolbox Talks
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowVehicles(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Truck className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Vehicle Management
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowEquipment(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Wrench className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Equipment Management
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowAccidents(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <AlertTriangle className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Accidents
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowSignage(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <ShieldAlert className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Signage
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowOrganisationChart(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <Users2 className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  Organisation Chart
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowDSE(true)}
                        className="bg-white overflow-hidden shadow rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <FileCheck className="h-6 w-6 text-gray-400" />
                              <div className="ml-5">
                                <div className="text-sm font-medium text-gray-500">
                                  DSE Assessment
                                </div>
                                <div className="text-lg font-medium text-gray-900 mt-1 text-left">
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              © {companyName} {currentTime.getFullYear()} | GC
            </div>
            <div className="flex flex-row justify-center md:justify-end items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setShowModulesModal(true)}
                className="text-indigo-600 hover:text-indigo-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium inline-flex items-center"
              >
                Admin
                <div className="ml-2 flex items-center">
                  {connectionStatus === 'checking' ? (
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                      title="Checking connection..."
                    />
                  ) : connectionStatus === 'connected' ? (
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full"
                      title="All systems operational"
                    />
                  ) : (
                    <div
                      className="w-2 h-2 bg-red-500 rounded-full"
                      title="Connection issues detected"
                    />
                  )}
                </div>
              </button>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <span>CRM VERSION 2</span>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modules Modal */}
      {showModulesModal && (
        <ModulesModal
          onClose={() => setShowModulesModal(false)}
          modules={modules}
          onModuleChange={handleModuleChange}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              User Settings
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                />
                <button
                  onClick={handleNameUpdate}
                  disabled={loadingName}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingName ? 'Saving...' : 'Save'}
                </button>
              </div>
              {nameError && (
                <p className="mt-2 text-sm text-red-600">{nameError}</p>
              )}
              {nameSuccess && (
                <p className="mt-2 text-sm text-green-600">
                  Name updated successfully!
                </p>
              )}
            </div>

            <form onSubmit={handlePasswordUpdate}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600">
                    Password updated successfully!
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Settings Modal */}
      {showCompanySettingsModal && (
        <CompanySettingsForm
          onClose={() => setShowCompanySettingsModal(false)}
        />
      )}

      {/* Purchase Order Modal */}
      {showPurchaseOrderModal && (
        <PurchaseOrderForm
          onClose={() => setShowPurchaseOrderModal(false)}
          onSuccess={() => {
            fetchData();
            setShowPurchaseOrderModal(false);
          }}
        />
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectForm
          onClose={() => setShowProjectModal(false)}
          onSuccess={() => {
            fetchData();
            setShowProjectModal(false);
          }}
        />
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <QuoteForm
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            fetchData();
            setShowQuoteModal(false);
          }}
        />
      )}

      {/* Mobile styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 640px) {
            dl dt, dl dd {
              text-align: left !important;
            }
            .flex.items-center.justify-between {
              align-items: flex-start;
            }
            dl dd {
              margin-top: 0.25rem;
            }
            ul.mt-2.text-sm.text-gray-500.space-y-1 {
              text-align: left;
            }
            .grid.grid-cols-1.gap-4 {
              align-items: start;
            }
            .bg-white.rounded-lg.shadow.p-6 {
              height: auto;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .flex.items-center.justify-between {
              width: 100%;
              align-items: flex-start;
            }
            dl {
              margin-top: 0;
            }
          }
        `,
        }}
      />
    </div>
  );
}
