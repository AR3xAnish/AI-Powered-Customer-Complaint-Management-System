import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Header } from "./components/Header";
import { ComplaintForm } from "./components/LeftPane/ComplaintForm";
import { AIAssistant } from "./components/RightPane/AIAssistant";
import { TriageDrawer } from "./components/TriageQueue/TriageDrawer";
import { setComplaintsList } from "./store/slices/triageSlice";
import { fetchComplaintsApi } from "./api/client";

export const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    fetchComplaintsApi()
      .then((data) => {
        dispatch(setComplaintsList(data));
      })
      .catch((err) => {
        console.warn("Could not prefetch triage complaints:", err);
      });
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 min-h-0 overflow-hidden">
        <section className="flex-1 min-h-0 min-w-0 bg-white rounded-xl shadow-xs border border-slate-200 overflow-y-auto">
          <ComplaintForm />
        </section>
        <section className="flex-1 min-h-0 min-w-0 bg-white rounded-xl shadow-xs border border-slate-200 overflow-y-auto">
          <AIAssistant />
        </section>
      </main>
      <TriageDrawer />
    </div>
  );

};

export default App;

