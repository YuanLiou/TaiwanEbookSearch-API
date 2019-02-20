const rp = require('request-promise-native');
const cheerio = require('cheerio');
const url = require('url');
const marky = require('marky');

const title = 'taaze';

function searchBooks(keywords = '') {
  // start calc process time
  marky.mark('search');

  // URL encode
  keywords = encodeURIComponent(keywords);

  const options = {
    uri: `https://www.taaze.tw/search_go.html?keyword%5B%5D=${keywords}&keyType%5B%5D=0&prodKind=4&prodCatId=141`,
    resolveWithFullResponse: true,
    simple: false,
    gzip: true,
    timeout: 10000,
  };

  return rp(options).then(response =>{
    if (!(/^2/.test('' + response.statusCode))) {
      // console.log('Not found or error in taaze!');

      return [];
    }

    const books = _getBooks(cheerio.load(response.body));

    // 沒這書就直接傳吧
    if (books.length === 0) {
      return books;
    } else {
      // 再取得所有書的 info
      return _getBooksInfo(books);
    }
  }).then(books => {
    // calc process time
    const processTime = marky.stop('search').duration;

    return {
      title,
      isOkay: true,
      processTime,
      books,
    };

  }).catch(error => {
    // calc process time
    const processTime = marky.stop('search').duration;

    console.log(error.message);

    return {
      title,
      isOkay: false,
      processTime,
      books: [],
      error,
    };
  });
}

// 取得書籍們的資料
function _getBooksInfo(books = []) {
  // 等每本書都叫到資料再繼續
  return Promise.all(books.map(book => {
    return _getBookInfo(book.id);
  })).then(infos => {
    for (let i in books) {
      books[i].title = infos[i].booktitle;
      books[i].about = infos[i].bookprofile.replace(/\r/g, '');
      books[i].publisher = infos[i].publisher;
      books[i].publishDate = infos[i].publishDate;

      // 作者群有資料才放
      if (infos[i].authors) {
        books[i].authors;
      }

      // 有翻譯者才放
      if (infos[i].translator) {
        books[i].translator = infos[i].translator;
        books[i].translators = [infos[i].translator];
      }
    }

    return books;
  });
}

// parse 找書
function _getBooks($) {
  $list = $('#listView>div');

  let books = [];

  if ($list.length === 0) {
    // console.log('Not found in taaze!');

    return books;
  }

  $list.each((i, elem) => {
    // 先取得 id，部分資料需另叫 API 處理
    const id = $(elem).prop('rel');

    // 價格為折扣後
    const price = parseFloat($(elem).children('.info_frame').children('.cartPrice').children('.discPrice').text().replace(/定價：\d*元，優惠價：|\d*折|元/g, ''));

    books[i] = {
      id,
      thumbnail: `http://media.taaze.tw/showLargeImage.html?sc=${id}`,
      // title: info.booktitle,
      link: `https://www.taaze.tw/goods/${id}.html`,
      priceCurrency: 'TWD',
      price,
      // about: info.bookprofile,
      // publisher: info.publisher,
      // publishDate: info.publishdate,
      // authors: info.author,
    };
  });

  return books;
}

// 單本書部分資料
function _getBookInfo(id = '') {
  const options = {
    uri: 'https://www.taaze.tw/new_ec/rwd/lib/searchbookAgent.jsp',
    qs: {
      prodId: id
    },
    json: true,
  };

  return rp(options).then(info => {
    return info[0];
  });
}

exports.searchBooks = searchBooks;