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
    <div className="app-viewport">
      <Header />
      <main className="two-pane-container">
        <section className="pane-wrapper left-pane">
          <ComplaintForm />
        </section>
        <section className="pane-wrapper right-pane">
          <AIAssistant />
        </section>
      </main>
      <TriageDrawer />
    </div>
  );
};

export default App;
