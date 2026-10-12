import AppRoutes from "./AppRoutes";
import { ConfirmProvider } from "./components/common/ConfirmDialog";
import { ToastProvider } from "./components/common/Toast";

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppRoutes />
      </ConfirmProvider>
    </ToastProvider>
  );
}
