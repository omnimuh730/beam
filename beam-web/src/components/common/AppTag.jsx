import React from 'react';

const AppTag = ({ label, color }) => {
	// Notion's specific purple for applications
	const isApp = label === 'Application';
	const bgColor = isApp ? 'bg-[#3c2e48]' : color === 'gold' ? 'bg-[#463c25]' : 'bg-[#2C2C2C]';
	const textColor = isApp ? 'text-[#d6bbf5]' : color === 'gold' ? 'text-[#e9d6aa]' : 'text-gray-400';

	if (!label) return null;

	return (
		<span className={`${bgColor} ${textColor} text-[11px] font-medium px-1.5 py-0.5 rounded-[4px]`}>
			{label}
		</span>
	);
};

export default AppTag;