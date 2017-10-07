'use strict'
require('whatwg-fetch')
const $ = require('jquery')
const moment = require('moment')
const nunjucks = require('nunjucks')
const timeago = require('simple-timeago')

const $commentsList = $('.blog-post__comments__list')
const OK = 200

const nunjucksEnv = nunjucks.configure({autoescape: true})
const template = require('./templates/comments.html')(nunjucksEnv)

nunjucksEnv.addFilter('date', (input, format) => moment(input).format(format))
nunjucksEnv.addFilter('fuzzydate', input => timeago(new Date(input)))

if ($commentsList.length > 0) {
  const commentsIssueId = $commentsList.data('commentsIssueId')

  window.fetch(`https://api.github.com/repos/Rowno/roland.codes/issues/${commentsIssueId}/comments`, {
    headers: {
      Accept: 'application/vnd.github.v3.html+json'
    }
  })
  .then(response => {
    if (response.status === OK) {
      return response
    }

    const error = new Error(response.statusText)
    error.response = response
    throw new Error(response.statusText)
  })
  .then(response => response.json())
  .then(comments => {
    if (comments.length === 0) {
      $commentsList.html('No comments yet. ☹')
      return
    }

    const $comments = $(template.render({
      commentsIssueId,
      comments
    }))

    // Sanitise
    const $content = $comments.find('.blog-post__comment__content')
    $content.find('a').attr('rel', 'nofollow')
    $content.find('.email-hidden-toggle, .email-hidden-reply').remove()

    $commentsList.html($comments)
  }).catch(err => {
    $commentsList.html(`
      Oops, something broke while loading the comments.
      Please try again later or
      <a href="https://github.com/Rowno/roland.codes/issues/">report the problem</a>.
    `)
    throw err
  })
}
