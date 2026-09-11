import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleDrawer } from "../store/slices/triageSlice";
import { ShieldAlert, FolderArchive } from "lucide-react";

export const Header = () => {
  const dispatch = useDispatch();
  const { complaintsList } = useSelector((state) => state.triage);

  return (
    <header className="h-16 bg-slate-900 text-white border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20 shadow-md">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm border border-blue-400/30">
            <ShieldAlert size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              PharmaTriage <span className="text-blue-400 font-semibold">AI</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Customer Complaint Management
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-colors cursor-pointer shadow-xs"
          onClick={() => dispatch(toggleDrawer())}
          title="View Triage Queue"
        >
          <FolderArchive size={15} />
          <span>Triage Queue</span>
          {complaintsList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-white text-blue-700 rounded-full shadow-2xs">
              {complaintsList.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;


