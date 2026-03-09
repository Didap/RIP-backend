
export default {
  async beforeCreate(event) {
    const { data, where, select, populate } = event.params;
    
    // We can't easily get ctx here without some tricks, 
    // but we can ensure data is clean.
    console.log('--- LIFECYCLE beforeCreate Memorial:', data.full_name);
  },
};
