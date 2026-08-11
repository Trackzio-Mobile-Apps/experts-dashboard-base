import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const ExpertLoginPage = lazy(() => import("@/pages/ExpertLoginPage"));
const ExpertPanelLayout = lazy(() => import("@/pages/ExpertPanelLayout"));
const ExpertQueuePage = lazy(() => import("@/pages/ExpertQueuePage"));
const ExpertQueueRequestPage = lazy(
  () => import("@/pages/ExpertQueueRequestPage"),
);
const ExpertDraftsPage = lazy(() => import("@/pages/ExpertDraftsPage"));
const ExpertHistoryPage = lazy(() => import("@/pages/ExpertHistoryPage"));
const ExpertProfilePage = lazy(() => import("@/pages/ExpertProfilePage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const CheckEmailPage = lazy(() => import("@/pages/CheckEmailPage"));
const CreatePasswordPage = lazy(() => import("@/pages/CreatePasswordPage"));
const VerificationCodePage = lazy(() => import("@/pages/VerificationCodePage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-text-muted">
      Loading…
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sign-in" replace />} />
      <Route path="/sign-in" element={<Navigate to="/expert/login" replace />} />
      <Route path="/sign-up" element={withSuspense(<SignUpPage />)} />
      <Route
        path="/forgot-password"
        element={withSuspense(<ForgotPasswordPage />)}
      />
      <Route path="/check-email" element={withSuspense(<CheckEmailPage />)} />
      <Route
        path="/create-password"
        element={withSuspense(<CreatePasswordPage />)}
      />
      <Route
        path="/verification-code"
        element={withSuspense(<VerificationCodePage />)}
      />

      <Route path="/expert">
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={withSuspense(<ExpertLoginPage />)} />
        <Route element={withSuspense(<ExpertPanelLayout />)}>
          <Route path="queue" element={withSuspense(<ExpertQueuePage />)} />
          <Route
            path="queue/:reqId"
            element={withSuspense(<ExpertQueueRequestPage />)}
          />
          <Route path="drafts" element={withSuspense(<ExpertDraftsPage />)} />
          <Route path="history" element={withSuspense(<ExpertHistoryPage />)} />
          <Route path="profile" element={withSuspense(<ExpertProfilePage />)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/expert/login" replace />} />
    </Routes>
  );
}
