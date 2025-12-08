import React, { useState } from 'react';
import { Popover, Checkbox, Button } from 'antd';
import { Archive, Trash2, Clock } from 'lucide-react';
import AppTag from '../common/AppTag';

const MailRow = ({ mail }) => {
	const [hovered, setHovered] = useState(false);
	const isSelected = mail.selected;

	const popoverContent = (
		<div className="w-[400px] p-0 text-sm bg-[#1e1e1e] text-[#d4d4d4] border border-[#333]">
			<div className="p-3 font-semibold border-b border-[#333] flex justify-between">
				<span>{mail.subject}</span>
				<span className="text-xs text-gray-500">Just now</span>
			</div>
			<div className="p-3 text-gray-400 leading-relaxed">
				{mail.preview}
				<span className="bg-green-700 text-white px-1 ml-1 text-xs rounded">next</span>
			</div>
		</div>
	);

	return (
		<Popover
			content={popoverContent}
			title={null}
			trigger="hover"
			placement="bottomLeft"
			overlayInnerStyle={{ padding: 0, backgroundColor: '#1e1e1e', borderColor: '#333' }}
			open={hovered && isSelected}
		>
			<div
				className={`
          group relative flex items-center gap-3 px-4 py-2 border-b border-[#262626] cursor-pointer text-sm
          ${isSelected ? 'bg-[#2C2C2C]' : 'bg-[#191919] hover:bg-[#202020]'}
          transition-colors duration-150
        `}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<div className={`w-5 flex items-center justify-center ${hovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
					<Checkbox checked={isSelected} className="custom-checkbox" />
				</div>

				<div className="w-48 shrink-0 truncate text-[#E6E6E6] font-medium flex items-center gap-2">
					{mail.sender}
					{mail.count && <span className="text-xs text-gray-500 font-normal">{mail.count}</span>}
				</div>

				<div className="flex-1 truncate flex items-center gap-2 text-[#9B9B9B]">
					<span className="text-[#D4D4D4]">{mail.subject}</span>
					<span className="truncate opacity-60">{mail.preview}</span>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					{hovered && (
						<div className="flex items-center gap-1 text-gray-400 bg-[#202020] shadow-[-10px_0_10px_-5px_#202020]">
							<Button type="text" size="small" icon={<Archive size={15} />} />
							<Button type="text" size="small" icon={<Trash2 size={15} />} />
							<Button type="text" size="small" icon={<Clock size={15} />} />
						</div>
					)}
					<AppTag label={mail.tag} color={mail.tagColor} />
					<span className="text-xs text-[#666] w-16 text-right whitespace-nowrap">
						{mail.time}
					</span>
				</div>
			</div>
		</Popover>
	);
};

export default MailRow;