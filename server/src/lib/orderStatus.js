export const TRANSITIONS = {
  pending:   ['review', 'rejected'],
  review:    ['quotation', 'rejected'],
  quotation: ['approved', 'rejected'],
  approved:  ['running'],
  running:   ['completed'],
  completed: [],
  rejected:  [],
};

export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);
