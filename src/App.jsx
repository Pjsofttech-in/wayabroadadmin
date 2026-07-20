import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./Components/Common/PrivateRoute";
import LoadingOverlay from "./Components/Common/LoadingOverlay";
import ErrorBoundary from "./Components/Common/ErrorBoundary";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./Components/Layouts/Theme.jsx";

// Direct imports
import MainDashboard from "./Components/MainDash/MainDashboard";
import CreateBranch from "./Components/Branch/CreateBranch.jsx";
import InquirySidebar from "./Components/InquiryManagement/InquirySidebar.jsx";
import AbroadInquiryForm from "./Components/InquiryManagement/Pages/AbroadInquiryForm.jsx";
import AbroadInquiryList from "./Components/InquiryManagement/Pages/AbroadInquiryList.jsx";
import AbroadInquiryTodo from "./Components/InquiryManagement/Pages/AbroadInquiryTodo.jsx";
import AbroadInquiryFeedback from "./Components/InquiryManagement/Pages/AbroadInquiryFeedback.jsx";
import AbroadInquiryDashboard from "./Components/InquiryManagement/Pages/AbroadInquiryDashboard.jsx";
import AbroadInquiryQR from "./Components/InquiryManagement/Pages/AbroadInquiryQR.jsx";
import SettingSidebar from "./Components/Settings/SettingSideBar.jsx";
import ContinentRelation from "./Components/Courses/Continent/ContinentRelation.jsx";
import StreamManagement from "./Components/Settings/StreamManagement";
import CourseManagement from "./Components/Settings/CourseManagement";
import ConductByManagement from "./Components/Settings/ConductByManagement.jsx";
import BlogCategory from "./Components/Settings/BlogCategory.jsx";
// ✅ fixed casing
import BlogManagement from "./Components/Blog/BlogManagement.jsx";
import PartnerSidebar from "./Components/Partner/PartnerSidebar.jsx";
import AddPartner from "./Components/Partner/AddPartner.jsx";
import PartnerList from "./Components/Partner/PartnerList.jsx";
import IncomeExpense from "./Components/IncomeExpense/IncomeExpense.jsx";
import CourseFinder from "./Components/FindeCouese/CourseFinder.jsx";
import PartnerWebList from "./Components/Partner/PartnerWebList.jsx";
import ApplicationSidebar from "./Components/Application/ApplicationSidebar.jsx";
import AppicationCreate from "./Components/Application/AppicationCreate.jsx";
import ApplicationList from "./Components/Application/ApplicationList.jsx";
import ApplicationDashboard from "./Components/Application/ApplicationDashboard.jsx";
import RegisterList from "./Components/Register/RegisterList";
import RegisterForm from "./Components/Register/RegisterForm";
import RegistrationSidebar from "./Components/Register/RegisterationSidebar";
import RegistrationQRForm from "./Components/Register/RegisterationQR";
import PublicRegistration from "./Components/Register/PublicRegistration";
import ContactUsList from "./Components/ContactUs/ContactUsList";
import ContactUsForm from "./Components/ContactUs/ContactUsForm";
import ContactUsSidebar from "./Components/ContactUs/ContactUsSidebar";

// Marketing Components
import MarketingSideBar from "./Components/Marketing/MarketingSideBar";
import MarketingContactUsList from "./Components/Marketing/ContactUsList";
import ExamPreparationList from "./Components/Marketing/ExamPreparationList";
import RegistrationWebList from "./Components/Marketing/RegistrationWebList";
import { ScaleSharp } from "@mui/icons-material";
import ScholarshipSidebar from "./Components/ScholarShip/ScolarshipSidebar.jsx";
import ScholarShipForm from "./Components/ScholarShip/ScholarShipForm.jsx";
import ScholarshipList from "./Components/ScholarShip/ScholarshipList.jsx";
import ScholarshipLeadForm from "./Components/ScholarShip/ScholarshipLeadForm.jsx";
import ScholarshipLeadList from "./Components/ScholarShip/ScholarshipLeadList.jsx";
import ScholarshipSettings from "./Components/ScholarShip/ScholarshipSettings.jsx";

// Lazy-loaded components
const SidebarLoginContainer = lazy(
  () => import("./Components/AllLogin/SidebarLoginContainer"),
);
const Layout = lazy(() => import("./Components/Layouts/Layout.jsx"));

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/wayabroadadmin" replace />} />

          {/* Public routes */}
          <Route path="/wayabroadadmin" element={<SidebarLoginContainer />} />
          <Route
            path="/wayabroadadmin/register"
            element={<PublicRegistration />}
          />

          {/* Protected admin routes */}
          <Route
            path="/wayabroadadmin/admin"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Dashboard + Profile */}
            <Route path="dashboard" element={<MainDashboard />} />
            <Route
              path="Admin-Profile"
              element={<div>Settings Page Under Construction</div>}
            />
            <Route path="CreateBranch" element={<CreateBranch />} />
            <Route path="incomeexpense" element={<IncomeExpense />} />
            <Route path="CourceFinder" element={<CourseFinder />} />
            {/* <Route path="CreateStaff" element={<div>Settings Page Under Construction</div>} /> */}

            {/* Partner Section */}

            {/* <Route path="HelpDesk" element={<PartnerDetails />} /> */}
            <Route path="partner" element={<PartnerSidebar />}>
              <Route index element={<AddPartner />} />
              <Route path="list" element={<PartnerList />} />
              <Route path="web" element={<PartnerWebList />} />
            </Route>

            {/* Marketing */}
            <Route path="Marketing" element={<BlogManagement />} />

            {/* Courses Section */}
            <Route path="courses">
              <Route index element={<ContinentRelation />} />
            </Route>
            <Route path="application" element={<ApplicationSidebar />}>
              <Route index element={<ApplicationDashboard />} />
              <Route path="create" element={<AppicationCreate />} />
              <Route path="list" element={<ApplicationList />} />
              <Route path="dashboard" element={<ApplicationDashboard />} />
            </Route>

            {/* Settings Section */}
            <Route path="settings" element={<SettingSidebar />}>
              <Route index element={<Navigate to="stream" replace />} />
              <Route path="stream" element={<StreamManagement />} />
              <Route path="course" element={<CourseManagement />} />
              <Route path="blogCourses" element={<BlogCategory />} />
              <Route path="conduct-by" element={<ConductByManagement />}>
                <Route index element={<Navigate to="stream" replace />} />
              </Route>
            </Route>

            {/* Abroad Inquiry Section */}
            <Route path="abroadinquiry" element={<InquirySidebar />}>
              <Route index element={<AbroadInquiryDashboard />} />
              <Route path="abroadinquiryForm" element={<AbroadInquiryForm />} />
              <Route path="abroadinquiryList" element={<AbroadInquiryList />} />
              <Route path="abroadinquiryTodo" element={<AbroadInquiryTodo />} />
              <Route
                path="abroadinquiryFeedback"
                element={<AbroadInquiryFeedback />}
              />
              <Route path="qr-code" element={<AbroadInquiryQR />} />
            </Route>

            {/* Registration Management */}
            <Route path="registration" element={<RegistrationSidebar />}>
              <Route index element={<RegisterForm />} />
              <Route path="list" element={<RegisterList />} />
              <Route path="qr" element={<RegistrationQRForm />} />
              <Route path="create" element={<RegisterForm />} />
              <Route path="edit/:id" element={<RegisterForm />} />
            </Route>

            {/* Contact Us Section */}
            <Route path="ContactUs" element={<ContactUsSidebar />}>
              <Route index element={<ContactUsList />} />
              <Route path="create" element={<ContactUsForm />} />
              <Route path="edit/:id" element={<ContactUsForm />} />
            </Route>

            {/* Marketing Section */}
            <Route path="Marketing" element={<MarketingSideBar />}>
              <Route
                index
                element={<Navigate to="exampreparationlist" replace />}
              />
              <Route
                path="exampreparationlist"
                element={<ExamPreparationList />}
              />
              <Route
                path="webinquirylist"
                element={<MarketingContactUsList />}
              />
              <Route
                path="registrationweblist"
                element={<RegistrationWebList />}
              />
            </Route>

            {/* Scholarship Section */}
            <Route path="scholarship" element={<ScholarshipSidebar />}>
              <Route index element={<ScholarShipForm />} />
              <Route path="list" element={<ScholarshipList/>} />
              {/* <Route path="lead-form" element={<ScholarshipLeadForm />} /> */}
              <Route path="lead-list" element={<ScholarshipLeadList />} />
              <Route path="settings" element={<ScholarshipSettings />} />
            </Route>

            {/* Blog Management */}
            <Route path="blog" element={<BlogManagement />}>
              <Route index element={<BlogManagement />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/wayabroadadmin" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};

export default App;
