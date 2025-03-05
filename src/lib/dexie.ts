import Dexie, { Table } from "dexie";

interface Thread {
	id: string;
	title: string;
	created_at: Date;
	updated_at: Date;
}

interface Message {
	id: string;
	thread_id: string;
	role: "user" | "assistant";
	content: string;
	thought: string;
	created_at: Date;
}

class ChatDB extends Dexie {
	threads!: Table<Thread>;
	messages!: Table<Message>;

	constructor() {
		super("JustcAI");

		this.version(1).stores({
			threads: "id, title, created_at, updated_at",
			messages: "id, thread_id, role, content, thought, created_at",
		});

		this.threads.hook("creating", (_, obj) => {
			obj.created_at = new Date();
			obj.updated_at = new Date();
		});

		this.messages.hook("creating", (_, obj) => {
			obj.created_at = new Date();
		})
	}

	async createThread(title: string) {
		const id = crypto.randomUUID();
		await this.threads.add({
			id,
			title,
			created_at: new Date(),
			updated_at: new Date(),
		});
		return id;
	}

	async getThreads() {
		return this.threads.reverse().sortBy("updated_at");
	}

	async createMessage(
		message: Pick<Message, "content" | "role" | "thought" | "thread_id">
	) {
		const messageId = crypto.randomUUID();

		await this.transaction("rw", [this.threads, this.messages], async () => {
			await this.messages.add({
				...message,
				id: messageId,
				created_at: new Date(),
			});

			await this.threads.update(message.thread_id, {
				updated_at: new Date(),
			});
		})
	}

	async getMessagesForThread(threadId: string) {
		return this.messages.where("thread_id").equals(threadId).sortBy("created_at");
	}
}

export const db = new ChatDB();
