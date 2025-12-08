import React from 'react';

const TAG_PRESETS = {
	Application: {
		bg: 'bg-[#2f1f3f]',
		text: 'text-[#e4ccff]',
		border: 'border-[#4a2d63]',
	},
	Notify: {
		bg: 'bg-[#3c2711]',
		text: 'text-[#ffdba6]',
		border: 'border-[#5c3a16]',
	},
};

const AppTag = ({ label, color }) => {
	if (!label) return null;

	const preset = TAG_PRESETS[label];
	const bgColor = preset?.bg ?? (color === 'gold' ? 'bg-[#3c2a13]' : 'bg-[#1a1a1a]');
	const textColor = preset?.text ?? (color === 'gold' ? 'text-[#f5e3ba]' : 'text-[#a6a6a6]');
	const borderColor = preset?.border ?? 'border-[#2a2a2a]';

	return (
		<span className={`${bgColor} ${textColor} ${borderColor} inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]`}>
			{label}
		</span>
	);
};

export default AppTag;
