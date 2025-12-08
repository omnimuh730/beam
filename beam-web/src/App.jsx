import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import {
	Sparkles,
	SlidersHorizontal,
	LayoutList,
	RefreshCcw,
	MailOpen
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import MailRow from './components/mail/MailRow';
import { MAIL_DATA } from './data/mockData';
import { antdThemeConfig } from './theme/antdConfig';

const { Content } = Layout;

const headerActions = [
	{ id: 'filters', icon: SlidersHorizontal, label: 'Filters' },
	{ id: 'density', icon: LayoutList, label: 'Density' },
	{ id: 'refresh', icon: RefreshCcw, label: 'Refresh' },
];

const NotionMailClone = () => {
	return (
		<ConfigProvider theme={antdThemeConfig}>
			<Layout className="h-dvh overflow-hidden bg-[#0d0d0d] text-[#E5E5E5] font-['Inter',sans-serif]">
				<Sidebar />

				<Layout className="bg-[#0c0c0c]">
					<header className="h-14 px-6 border-b border-[#1f1f1f] flex items-center justify-between bg-gradient-to-b from-[#151515] to-[#101010]">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-[3px] bg-[#f25454]" />
								<span className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
									<MailOpen size={16} className="text-[#f25454]" />
									Inbox
								</span>
							</div>
							<span className="text-xs uppercase tracking-[0.35em] text-[#6f6f6f]">
								Focused • 24 new
							</span>
						</div>

						<div className="flex items-center gap-2 text-xs">
							<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2c2c2c] bg-[#181818] text-[11px] font-semibold tracking-wide text-[#f2c9ff] hover:border-[#3a3a3a] transition">
								<Sparkles size={14} className="text-[#ffb3ff]" />
								Auto label
							</button>

							<div className="h-4 w-px bg-[#2b2b2b]" />

							{headerActions.map(action => (
								<button
									key={action.id}
									className="p-2 rounded-md border border-transparent text-[#8e8e8e] hover:text-white hover:border-[#2a2a2a] hover:bg-[#161616] transition"
									aria-label={action.label}
								>
									<action.icon size={16} />
								</button>
							))}
						</div>
					</header>

					<Content className="custom-scrollbar overflow-y-auto bg-[#0b0b0b]">
						<div className="flex flex-col divide-y divide-[#1c1c1c]">
							{MAIL_DATA.map(mail => (
								<MailRow key={mail.id} mail={mail} />
							))}
						</div>
						<div className="h-24" />
					</Content>
				</Layout>
			</Layout>
		</ConfigProvider>
	);
};

export default NotionMailClone;
