import { Buffer } from "node:buffer";
import { describe, expect, it } from "bun:test";

import {
	extractBodies,
	pickHeader,
	removeUndefined,
	urlSafeDecode,
} from "./gmailSync";

describe("gmailSync helper utilities", () => {
	it("decodes base64url data emitted by Gmail", () => {
		const original = "Synchronous beam!";
		const encoded = Buffer.from(original)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/u, "");

		expect(urlSafeDecode(encoded)).toBe(original);
	});

	it("selects headers in a case-insensitive way", () => {
		const headers = [
			{ name: "subject", value: "Lowercase" },
			{ name: "X-Custom", value: "abc" },
		];
		expect(pickHeader(headers, "Subject")).toBe("Lowercase");
		expect(pickHeader(headers, "missing")).toBeUndefined();
	});

	it("extracts both plain-text and HTML bodies from nested payloads", () => {
		const plainBody = "Plain text body";
		const htmlBody = "<p>HTML Body</p>";
		const payload = {
			mimeType: "multipart/alternative",
			parts: [
				{
					mimeType: "text/plain",
					body: { data: Buffer.from(plainBody).toString("base64") },
				},
				{
					mimeType: "multipart/related",
					parts: [
						{
							mimeType: "text/html",
							body: { data: Buffer.from(htmlBody).toString("base64") },
						},
					],
				},
			],
		};

		const result = extractBodies(payload);
		expect(result.plainBody).toBe(plainBody);
		expect(result.htmlBody).toBe(htmlBody);
	});

	it("removes undefined keys while preserving falsy values", () => {
		const cleaned = removeUndefined({
			ok: true,
			count: 0,
			optional: undefined,
			description: null,
		});

		expect(cleaned).toEqual({
			ok: true,
			count: 0,
			description: null,
		});
	});
});
