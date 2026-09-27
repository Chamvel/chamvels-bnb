// Reviews now live in Firestore (a Firebase database), not the browser's
// localStorage - so every visitor, on any device, sees the same list.
// onSnapshot() below keeps that list "live": it re-runs automatically
// whenever a review is added, no page reload needed.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD68ISNPikCiCJfCtvnQTCSaFMPE5g7LMk',
  authDomain: 'chamvel-s-bnb.firebaseapp.com',
  projectId: 'chamvel-s-bnb',
  storageBucket: 'chamvel-s-bnb.firebasestorage.app',
  messagingSenderId: '158789145533',
  appId: '1:158789145533:web:a92ea8f23821dac357b8d4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reviewsCollection = collection(db, 'reviews');

// --- reviews ---

function starString(rating) {
  const rounded = Math.round(rating);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function renderReviews(reviews) {
  const listEl = document.getElementById('revList');
  listEl.innerHTML = '';

  reviews.forEach((review) => {
    const item = document.createElement('div');
    item.className = 'rev-item';

    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('strong');
    name.textContent = review.name;

    const date = document.createElement('time');
    date.textContent = review.date;

    row.appendChild(name);
    row.appendChild(date);

    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.style.fontSize = '0.85rem';
    stars.textContent = starString(review.rating);

    const comment = document.createElement('p');
    comment.textContent = review.comment;

    item.appendChild(row);
    item.appendChild(stars);
    item.appendChild(comment);
    listEl.appendChild(item);
  });

  const average = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length
    : 0;

  document.getElementById('revAvg').textContent = reviews.length ? average.toFixed(1) : '–';
  document.getElementById('revStars').textContent = reviews.length ? starString(average) : '☆☆☆☆☆';
  document.getElementById('revCount').textContent = reviews.length
    ? reviews.length + ' review' + (reviews.length === 1 ? '' : 's')
    : 'No reviews yet';

  // the hero's "guest rating" stat mirrors this same average
  document.getElementById('heroRating').textContent = reviews.length ? average.toFixed(1) : '–';
}

// listens for changes in the "reviews" collection and re-renders
// automatically - this fires once immediately with whatever is already
// there, then again every time a review is added by anyone, anywhere
const reviewsQuery = query(reviewsCollection, orderBy('createdAtMillis', 'desc'));

onSnapshot(reviewsQuery, (snapshot) => {
  const reviews = snapshot.docs.map((doc) => doc.data());
  renderReviews(reviews);
}, (error) => {
  console.error('Could not load reviews:', error);
});

document.getElementById('revForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const ratingInput = document.querySelector('input[name="rating"]:checked');
  const name = document.getElementById('revName').value.trim();
  const comment = document.getElementById('revComment').value.trim();
  const message = document.getElementById('revMsg');

  if (!ratingInput) {
    message.style.color = '#C1791F';
    message.textContent = 'Please choose a star rating.';
    return;
  }

  if (!name || !comment) {
    message.style.color = '#C1791F';
    message.textContent = 'Please add your name and a comment.';
    return;
  }

  try {
    await addDoc(reviewsCollection, {
      name: name,
      rating: Number(ratingInput.value),
      comment: comment,
      date: new Date().toISOString().slice(0, 10),
      createdAtMillis: Date.now()
    });

    this.reset();
    message.style.color = 'var(--green-soft)';
    message.textContent = 'Thanks — your review has been added.';
    setTimeout(() => { message.textContent = ''; }, 4000);

  } catch (error) {
    console.error('Could not save review:', error);
    message.style.color = '#C1791F';
    message.textContent = 'Something went wrong - please try again.';
  }
});
