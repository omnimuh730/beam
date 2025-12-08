import { theme } from 'antd';

export const antdThemeConfig = {
	algorithm: theme.darkAlgorithm,
	token: {
		colorPrimary: '#2eaadc', // Notion Blue/Teal
		colorBgContainer: '#191919',
		colorBgLayout: '#191919',
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
	},
	components: {
		Checkbox: {
			colorBgContainer: 'transparent',
			colorPrimary: '#2eaadc',
		}
	}
};