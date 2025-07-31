import { useEffect, useState } from "react";
import useAuthStore from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard"
import { compareVersions } from "compare-versions"; 
import { APP_VERSION } from "../constants/version";
import {
  CloudArrowUpIcon,
  RectangleStackIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

 const CURRENT_VERSION = APP_VERSION

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");

  const CHANGELOG = [
    { date: '2025-05-27', version: 'v1.2.0', notes: 'Docker version released with license key support' },
    { date: '2025-05-03', version: 'v1.1.9', notes: 'Transitioned from SaaS to self-hosted model' },
    { date: '2025-04-20', version: 'v1.1.0', notes: 'Released schema store and user dashboard' },
    { date: '2025-04-12', version: 'v1.0.0', notes: 'Official launch of LayerNEXUS with AI schema features' },
    { date: '2025-04-06', version: 'v0.9.0', notes: 'Rebranded from dbZERO to LayerNEXUS' },
    { date: '2025-03-10', version: 'v0.5.0', notes: 'Core backend and AI logic implemented' },
    { date: '2025-02-28', version: 'v0.1.0', notes: 'Project started: dbZERO initial prototype' },
  ];


    useEffect(() => {
    fetch("https://layernexus.com/version.json")
      .then((res) => res.json())
      .then((data) => {
        if (compareVersions(CURRENT_VERSION, data.min_supported) < 0) {
          setIsOutdated(true);
          setLatestVersion(data.latest);
        }
      })
      .catch((err) => {
        console.warn("Version check failed", err);
      });
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{user?.username ? `, ${user.username}` : ""} 👋
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your AI assistant for turning messy data into clean database schemas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Upload Files"
          description="Start with raw CSV files and infer schema structure."
          Icon={CloudArrowUpIcon}
          onClick={() => navigate("/upload")}
        />
        <DashboardCard
          title="Saved Schemas"
          description="Review, edit, or export your existing schema projects."
          Icon={RectangleStackIcon}
          onClick={() => navigate("/schema-store")}
        />
        <DashboardCard
          title="Help & Support"
          description="Access the knowledge base, tips, and contact options."
          Icon={QuestionMarkCircleIcon}
          onClick={() => navigate("/help")}
        />
      </div>

        {/* Demo & Changelog Section */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Watch the Demo */}
            <div className="flex flex-col h-full">
              <h2 className="text-2xl font-semibold mb-4">Watch the Demo</h2>
              <div className="flex-grow">
                <div className="relative w-full h-0 pb-[56.25%]">
                  <iframe
                    src="https://www.loom.com/embed/1a09a48510894739a6eafee8a8c3ff33?sid=2014d0c4-9db8-4d91-8c62-34c0e4bd71ea"
                    frameBorder="0"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* What's New */}
            <div className="flex flex-col h-full">
              <h2 className="text-2xl font-semibold mb-4">What’s New</h2>
              <ul className="flex-grow space-y-2 max-h-90 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
                {CHANGELOG.map(({ date, version, notes }) => (
                  <li key={version} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{date}</span>
                      <span className="font-medium">{version}</span>
                    </div>
                    <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                      {notes}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

      
      {isOutdated && (
          <div className="mt-20 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded shadow-md">
            <strong>New Release: <code>{latestVersion} </code></strong> We highly recommend updating to take advantage of the latest features and improvements.
             [<strong>Current Version: <code>{CURRENT_VERSION}</code></strong> ]
            <a
              href="https://layernexus.com/changelog"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-2 inline-block mt-1"
            >
              View Latest Release →
            </a>
          </div>
        )}
    
    </div>
    
  );
}
