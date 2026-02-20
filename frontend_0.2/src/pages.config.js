/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Achievements from './pages/Achievements';
import AdminAgents from './pages/AdminAgents';
import AdminConstraints from './pages/AdminConstraints';
import AdminOverview from './pages/AdminOverview';
import AdminSettings from './pages/AdminSettings';
import Allocation from './pages/Allocation';
import Analytics from './pages/Analytics';
import AuditLog from './pages/AuditLog';
import Console from './pages/Console';
import Home from './pages/Home';
import Insights from './pages/Insights';
import MyProfile from './pages/MyProfile';
import MyReasons from './pages/MyReasons';
import MyTasks from './pages/MyTasks';
import Projects from './pages/Projects';
import Scenarios from './pages/Scenarios';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminAgents": AdminAgents,
    "AdminConstraints": AdminConstraints,
    "AdminOverview": AdminOverview,
    "AdminSettings": AdminSettings,
    "Allocation": Allocation,
    "Analytics": Analytics,
    "AuditLog": AuditLog,
    "Console": Console,
    "Home": Home,
    "Insights": Insights,
    "MyProfile": MyProfile,
    "MyReasons": MyReasons,
    "MyTasks": MyTasks,
    "Projects": Projects,
    "Scenarios": Scenarios,
    "Tasks": Tasks,
    "Team": Team,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};