import React from 'react';
import { ConfigProvider, Layout } from 'antd';
import { Filter, ArrowUpDown, Clock, Sparkles } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import MailRow from './components/mail/MailRow';
import { MAIL_DATA } from './data/mockData';
import { antdThemeConfig } from './theme/antdConfig';

const { Content } = Layout;

const NotionMailClone = () => {
	return (
		<ConfigProvider theme={antdThemeConfig}>
			<Layout className="h-screen overflow-hidden bg-[#191919] text-[#D4D4D4]">

				<Sidebar />

				<Layout className="bg-[#191919]">
					{/* Header Area */}
					<div className="h-12 flex items-center justify-between px-4 border-b border-[#262626] shrink-0">
						<div className="flex items-center gap-3">
							<span className="font-semibold text-[#E6E6E6]">Inbox</span>
						</div>

						<div className="flex items-center gap-2">
							<button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:bg-[#2C2C2C] border border-[#333]">
								<Sparkles size={12} /> Auto label
							</button>
							<div className="h-4 w-[1px] bg-[#333] mx-1"></div>
							<button className="text-gray-400 hover:text-white p-1"><Filter size={16} /></button>
							<button className="text-gray-400 hover:text-white p-1"><ArrowUpDown size={16} /></button>
							<button className="text-gray-400 hover:text-white p-1"><Clock size={16} /></button>
						</div>
					</div>

					{/* Mail List Area */}
					<Content className="overflow-y-auto">
						{MAIL_DATA.map(mail => (
							<MailRow key={mail.id} mail={mail} />
						))}
						{/* Empty space filler */}
						<div className="h-full min-h-[500px]"></div>
					</Content>

				</Layout>
			</Layout>
		</ConfigProvider>
	);
};

export default NotionMailClone;