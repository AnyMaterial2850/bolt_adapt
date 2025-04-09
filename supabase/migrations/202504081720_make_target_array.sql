alter table habits
alter column target type numeric[] using array[target];
