/**
 * Navigation Bar Component
 * 
 * Main navigation component featuring:
 * - User profile/settings
 * - Email category filters
 * - Search functionality
 * - Notification indicators
 * - Sign out option
 */

import { folderConfig } from '../lib/folderConfig';

export default function Navbar({ onFolderSelect }) {
  return (
    <nav className="w-64 h-screen bg-[#1A1B1E] text-white p-4 flex flex-col">
      <div className="mb-6">
        <button className="w-full bg-[#6366F1] text-white rounded-lg py-3 px-4 hover:bg-[#5558E3] transition-colors">
          Compose
        </button>
      </div>

      {/* Primary Folders */}
      <div className="space-y-1">
        {folderConfig.primary.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onFolderSelect(folder.id)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-[#2D2E32] rounded-lg transition-colors"
          >
            <span className="flex-shrink-0 w-5">
              {folder.icon === 'inbox' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V4H6z" />
                </svg>
              )}
            </span>
            <span className="flex-1 text-left">{folder.label}</span>
            <span className="text-xs text-gray-500">12,923</span>
          </button>
        ))}
      </div>

      {/* Category Folders */}
      <div className="mt-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
          Folders
        </div>
        <div className="space-y-1">
          {folderConfig.categories.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-[#2D2E32] rounded-lg transition-colors"
            >
              <span className="flex-shrink-0 w-5">
                {folder.icon === 'briefcase' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z" />
                  </svg>
                )}
                {folder.icon === 'user' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
                {folder.icon === 'tag' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                  </svg>
                )}
                {folder.icon === 'newspaper' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M22 3l-1.67 1.67L18.67 3L17 4.67L15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3L7 4.67L5.33 3L3.67 4.67L2 3v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V3zM11 19H4v-6h7v6zm9 0h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4H4V8h16v3z" />
                  </svg>
                )}
                {folder.icon === 'bell' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                )}
              </span>
              <span className="flex-1 text-left">{folder.label}</span>
              <span className="text-xs text-gray-500">{folder.id === 'work' ? '132' : folder.id === 'personal' ? '264' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}