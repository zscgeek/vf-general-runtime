export class Partition<Key extends string, Value> {
  private readonly partitionGroups: Map<Key, Value[]> = new Map();

  private readonly groupNames: Set<Key> = new Set();

  constructor(items: Value[], getGroupName: (val: Value) => Key) {
    items.forEach((item) => {
      const groupName = getGroupName(item);
      if (!this.partitionGroups.has(groupName)) {
        this.partitionGroups.set(groupName, []);
        this.groupNames.add(groupName);
      }
      const group = this.partitionGroups.get(groupName);
      if (!group) {
        throw new Error('`getGroup` returned a group name that was not specified in `groupNames`');
      }
      group.push(item);
    });
  }

  public group(name: Key): Value[] {
    if (!this.groupNames.has(name)) {
      throw new Error(`could not retrieve item from unknown group ${name}`);
    }
    return this.partitionGroups.get(name)!;
  }
}
