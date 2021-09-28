class APIFeatures  {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = {...this.queryString};
    const excludedItems = ['sort', 'page', 'limit', 'fields'];
    excludedItems.forEach(el => delete queryObj[el]);

// Advance Querying
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // console.log('Query:', this.query);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            console.log('sortBy is:', sortBy);
            this.query =this.query.sort(sortBy);
          } else {
            this.query = this.query.sort('-createdAt');
          }

          return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }

    return this;
  }
  paginate() {
    const limit = Number(this.queryString.limit) || 100;
    const page = Number(this.queryString.page) || 1;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;