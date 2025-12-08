import React, { useState } from 'react';
import { Popover, Checkbox } from 'antd';
import { Archive, Trash2, Clock, Star, MailCheck } from 'lucide-react';
import AppTag from '../common/AppTag';

const rowActions = [
	{ id: 'star', icon: Star, label: 'Star' },
	{ id: 'archive', icon: Archive, label: 'Archive' },
	{ id: 'snooze', icon: Clock, label: 'Snooze' },
	{ id: 'done', icon: MailCheck, label: 'Mark done' },
	{ id: 'trash', icon: Trash2, label: 'Delete' },
];

const MailRow = ({ mail }) => {
	const [hovered, setHovered] = useState(false);
	const isSelected = Boolean(mail.selected);
	const showCheckbox = hovered || isSelected;

	const popoverContent = (
		<div className="w-[420px] text-sm bg-[#151515] text-[#d4d4d4] border border-[#2f2f2f] rounded-lg overflow-hidden shadow-2xl">
			<div className="p-4 border-b border-[#222]">
				<p className="text-xs uppercase tracking-[0.3em] text-[#666] mb-1">{mail.sender}</p>
				<div className="flex items-center justify-between">
					<p className="font-semibold text-white">{mail.subject}</p>
					<span className="text-xs text-[#777]">{mail.time}</span>
				</div>
			</div>
			<div className="p-4 text-[#9c9c9c] leading-relaxed">
				{mail.preview}
				<span className="bg-[#1f6131] text-[#d5fadf] px-2 py-0.5 ml-2 text-[11px] rounded-full uppercase tracking-widest">
					next
				</span>
			</div>
		</div>
	);

	return (
		<Popover
			content={popoverContent}
			placement="bottomLeft"
			open={hovered && isSelected}
			trigger="hover"
			showArrow={false}
		>
			<div
				className={`group relative flex items-center gap-4 px-6 py-3 text-sm border-b border-[#1a1a1a] cursor-pointer transition-all
          ${isSelected ? 'bg-[#181818] shadow-[inset_3px_0_0_0_#8e72ff]' : 'bg-transparent hover:bg-[#121212]'}
        `}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<div className={`w-6 flex items-center justify-center transition-opacity ${showCheckbox ? 'opacity-100' : 'opacity-0'}`}>
					<Checkbox checked={isSelected} className="custom-checkbox" />
				</div>

				<div className="w-56 shrink-0 flex items-center gap-2 truncate text-[#f3f3f3] font-medium">
					<span className="truncate">{mail.sender}</span>
					{mail.count && <span className="text-xs text-[#6f6f6f] font-normal">{mail.count}</span>}
				</div>

				<div className="flex-1 flex items-center gap-2 min-w-0">
					<span className={`truncate text-[#e6e6e6] ${mail.read ? 'font-medium' : 'font-semibold'}`}>
						{mail.subject}
					</span>
					<span className="truncate text-[#6f6f6f]">— {mail.preview}</span>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<div className={`flex items-center gap-1 transition-all duration-200 ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
						{rowActions.map(action => {
							const ActionIcon = action.icon;
							return (
								<button
									key={action.id}
									className="p-1.5 rounded-md text-[#8a8a8a] hover:text-white hover:bg-[#1f1f1f] transition"
									aria-label={action.label}
								>
									<ActionIcon size={15} />
								</button>
							);
						})}
					</div>
					<AppTag label={mail.tag} color={mail.tagColor} />
					<span className="text-xs text-[#6f6f6f] w-16 text-right whitespace-nowrap">
						{mail.time}
					</span>
				</div>
			</div>
		</Popover>
	);
};

export default MailRow;
