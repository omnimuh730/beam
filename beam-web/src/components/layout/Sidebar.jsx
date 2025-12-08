import React from 'react';
import { Layout, Avatar } from 'antd';
import {
	Search,
	Inbox,
	Tag,
	Calendar,
	Plus,
	Mail,
	Send,
	FileText,
	AlertOctagon,
	Trash2,
	Settings,
	HelpCircle,
	PenSquare
} from 'lucide-react';

const { Sider } = Layout;

const navSections = [
	{
		title: 'Views',
		items: [
			{ icon: Inbox, label: 'Inbox', badge: '54', active: true },
			{ icon: Tag, label: 'Labels' },
			{ icon: Calendar, label: 'Calendar' },
		],
		cta: { icon: Plus, label: 'Add view' }
	},
	{
		title: 'Mail',
		items: [
			{ icon: Mail, label: 'All Mail' },
			{ icon: Send, label: 'Sent' },
			{ icon: FileText, label: 'Drafts' },
			{ icon: AlertOctagon, label: 'Spam' },
			{ icon: Trash2, label: 'Trash' },
		],
	},
];

const NavItem = ({ icon, label, badge, active }) => {
	const IconComponent = icon;
	return (
		<button
			className={`group w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all
        ${active ? 'bg-[#1d1d1d] text-white shadow-[0_0_0_1px_#2c2c2c]' : 'text-[#9b9b9b] hover:bg-[#181818] hover:text-white'}
      `}
		>
			<span className="flex items-center gap-3">
				<IconComponent size={16} className={active ? 'text-white' : 'text-[#6a6a6a] group-hover:text-white'} />
				{label}
			</span>
			{badge && <span className="text-xs text-[#6f6f6f]">{badge}</span>}
		</button>
	);
};

const SidebarIconButton = ({ icon, label }) => {
	const IconComponent = icon;
	return (
		<button
			className="p-2 rounded-md border border-[#2a2a2a] bg-[#141414] text-[#b1b1b1] hover:text-white hover:border-[#3a3a3a] transition"
			aria-label={label}
		>
			<IconComponent size={14} />
		</button>
	);
};

const Sidebar = () => {
	return (
		<Sider
			width={270}
			className="border-r border-[#1b1b1b] h-full flex flex-col bg-[#101010]"
		>
			<div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a]">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Avatar
							size={32}
							src="https://api.dicebear.com/7.x/avataaars/svg?seed=Terry"
							className="bg-purple-600"
						/>
						<div>
							<p className="text-sm font-semibold text-white">Terry Huang</p>
							<p className="text-[11px] text-[#7c7c7c]">Personal workspace</p>
						</div>
					</div>
					<div className="flex gap-2">
						<SidebarIconButton icon={PenSquare} label="Compose" />
						<SidebarIconButton icon={Plus} label="New" />
					</div>
				</div>
			</div>

			<div className="px-4 py-4">
				<button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#161616] border border-[#252525] text-[#9d9d9d] hover:border-[#3a3a3a] transition text-sm">
					<Search size={14} />
					<span>Search</span>
				</button>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar px-3">
				{navSections.map(section => {
					const CtaIcon = section.cta?.icon;
					return (
						<div key={section.title} className="mb-6">
							<div className="px-1 pb-2 text-[10px] uppercase tracking-[0.3em] text-[#5b5b5b]">{section.title}</div>
							<div className="space-y-1">
								{section.items.map(item => (
									<NavItem key={item.label} {...item} />
								))}
							</div>
							{section.cta && CtaIcon && (
								<button className="mt-3 w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#2a2a2a] text-xs font-semibold text-[#bdbdbd] hover:border-[#3a3a3a] hover:text-white transition">
									<CtaIcon size={14} />
									{section.cta.label}
								</button>
							)}
						</div>
					);
				})}
			</div>

			<div className="px-3 pb-4 border-t border-[#1a1a1a] pt-3 space-y-1">
				<NavItem icon={Settings} label="Settings" />
				<NavItem icon={HelpCircle} label="Send feedback" />
			</div>
		</Sider>
	);
};

export default Sidebar;
