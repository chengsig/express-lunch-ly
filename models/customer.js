/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");


/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */

  set notes(val) {
    this._notes = val || '';
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** method for return fullName for a given customer */

  get fullName() {
    return this.firstName + " " + this.lastName;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all customers that match search term */
  static async search(searchTerm) {
    let $1;
    let $2;
    let searches = searchTerm.split(" ");
    if (searches.length === 1) {
      $1 = searches[0];
    }
    else if (searches.length === 2) {
      $1 = searches[0];
      $2 = searches[1];
    }
    let sql = `SELECT id, 
                first_name AS "firstName",  
                last_name AS "lastName", 
                phone, 
                notes
              FROM customers
              WHERE first_name ILIKE $1
              OR last_name ILIKE $2
              OR (first_name ILIKE $1
                AND last_name ILIKE $2)`

    const results = await db.query(sql, [`%${$1}%`, `%${$2}%`]
    );

    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** return the top 10 customers who have the most reservations */
  static async getTopTenCustomers() {
    const results = await db.query(
      `SELECT customer_id AS "id", first_name AS "firstName", last_name AS "lastName", phone, customers.notes AS "notes"
      FROM reservations
      JOIN customers
      ON reservations.customer_id=customers.id
      GROUP BY customer_id, first_name, last_name, phone, customers.notes
      ORDER BY COUNT(customer_id) DESC
      LIMIT 10`
    )
  
    return results.rows.map(c => new Customer(c))
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]);
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4)
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]);
    }
  }
}


module.exports = Customer;
