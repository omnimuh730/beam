import React from 'react';
import { Layout, Avatar } from 'antd';
import {
	Search, Inbox, Tag, Calendar, Plus, Mail, Send, File,
	AlertOctagon, Trash2, Settings, HelpCircle, Pencil
} from 'lucide-react';

const { Sider } = Layout;

const NavItem = ({ icon: Icon, label, active, count }) => (
	<div
		className={`
      flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-pointer group transition-all
      ${active ? 'bg-[#2C2C2C] text-white' : 'text-[#9B9B9B] hover:bg-[#252525] hover:text-[#D3D3D3]'}
    `}
	>
		<div className="flex items-center gap-2.5 text-sm font-medium">
			<Icon size={16} strokeWidth={2} />
			<span>{label}</span>
		</div>
		{count && <span className="text-xs opacity-60">{count}</span>}
	</div>
);

const Sidebar = () => {
	return (
		<Sider
			width={240}
			className="border-r border-[#262626] h-full flex flex-col pt-3 pb-3"
			style={{ backgroundColor: '#191919' }}
		>
			{/* User Profile */}
			<div className="px-4 mb-4 flex items-center justify-between cursor-pointer">
				<div className="flex items-center gap-2">
					<Avatar size="small" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Terry" className="bg-purple-600" />
					<span className="font-medium text-sm text-[#E6E6E6]">Terry Huang</span>
				</div>
				<Pencil size={14} className="text-gray-500" />
			</div>

			{/* Search Bar */}
			<div className="px-3 mb-2">
				<div className="flex items-center gap-2 bg-[#262626] px-2 py-1.5 rounded-md text-gray-500 hover:bg-[#2f2f2f] cursor-text transition-colors border border-transparent hover:border-[#444]">
					<Search size={14} />
					<span className="text-sm">Search</span>
				</div>
			</div>

			{/* Navigation Links */}
			<div className="flex-1 overflow-y-auto custom-scrollbar">
				<div className="mb-4">
					<div className="px-4 py-1 text-[11px] font-semibold text-[#666]">Views</div>
					<NavItem icon={Inbox} label="Inbox" active count={12} />
					<NavItem icon={Tag} label="Labels" />
					<NavItem icon={Calendar} label="Calendar" />
					<NavItem icon={Plus} label="Add view" />
				</div>

				<div className="mb-4">
					<div className="px-4 py-1 text-[11px] font-semibold text-[#666]">Mail</div>
					<NavItem icon={Mail} label="All Mail" />
					<NavItem icon={Send} label="Sent" />
					<NavItem icon={File} label="Drafts" />
					<NavItem icon={AlertOctagon} label="Spam" />
					<NavItem icon={Trash2} label="Trash" />
				</div>
			</div>

			{/* Footer Settings */}
			<div className="mt-auto pt-2">
				<NavItem icon={Settings} label="Settings" />
				<NavItem icon={HelpCircle} label="Send feedback" />
			</div>
		</Sider>
	);
};

export default Sidebar;