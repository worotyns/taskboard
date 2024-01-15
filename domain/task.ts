import { Atom, PropertiesOnly } from "atoms";

interface Log {
  when: Date;
  message: string;
}

export class Task extends Atom<Task> {
  static create(description: string, creator: string) {
    return Object.assign(new Task(), {
      description: description,
      createdDate: new Date(),
      creator: creator,
      voters: [],
      completed: false,
      log: []
    });
  }

  public description = "";

  public assignedAt: Date | null = null;
  public completedAt: Date | null = null;

  public createdDate: Date = new Date();
  public assigned: string | null = null;
  
  public creator = "";

  public voters: string[] = [];
  public completed = false;

  public log: Log[] = [];

  private appendToLog(message: string) {
    this.log.push({ when: new Date(), message });
  }

  private logAndReturn(message: string) { 
    this.appendToLog(message);
    return message;
  }

  vote(voter: string): string {
    if (!this.voters.includes(voter)) {
      this.voters.push(voter);
      return this.logAndReturn(`${voter} voted for task: ${this.identity}`);
    } else {
      throw new Error(`${voter} has already voted for this task.`);
    }
  }

  assign(assignee: string): string {
    if (this.assigned === null) {
      this.assignedAt = new Date();
      this.assigned = assignee;
      return this.logAndReturn(`${assignee} assigned to task: ${this.identity}`);
    } else {
      throw new Error(`Task "${this.identity}" already assigned.`);
    }
  }

  unassign(requestBy: string): string {
    if (this.assigned) {
      const assignee = this.assigned;

      const isAssignee = this.assigned === requestBy;
      const isCreator = this.creator === requestBy;

      if (!isAssignee || !isCreator) { 
        throw new Error(`Only the assignee (${this.assigned}) or creator (${this.creator}) can unassign from this task.`);
      }

      this.assignedAt = null;
      this.assigned = null;
      return this.logAndReturn(`${assignee} unassigned from task: ${this.identity}`);
    } else {
      throw new Error(`Task "${this.identity}" already unassigned.`);
    }
  }

  markAsCompleted(requestedBy: string): string {
    if (this.creator === requestedBy || this.assigned === requestedBy) {
      this.completed = true;
      this.completedAt = new Date();
      return this.logAndReturn(`Task "${this.identity}" marked as completed by ${requestedBy}`);
    } else {
      throw new Error(
        `Only the creator (${this.creator}) can mark this task as completed.`,
      );
    }
  }

  static deserialize(rawValue: PropertiesOnly<Task>) {
    return Object.assign(
      new Task(),
      { ...rawValue, 
        createdDate: new Date(rawValue.createdDate), 
        log: (rawValue.log || []).map((l) => ({ ...l, when: new Date(l.when) })) 
      },
    );
  }
}
