# 8rain Station Enhancer

## Features

The 8rain Station Enhancer is a Chrome extension designed to improve the
usability of the [8rain Station](https://8rainstation.com/) website. 8rain
Station is an outstanding tool for persons wanting to place mathematically
advantaged sports wagers. The website is great, and they continue to add
features, however, they currently have higher priorities than working on
the features this extension provides. The features this extension adds includes:

* Making sportsbook names clickable links (when the CTRL key is depressed)
  that launch to the sportsbook. (Note that I do not send the referrer header,
  so the sportsbook will not know you are coming from 8rain Station.)
* Hitting CTRL-m on the bet market details page when the details form is
  visible will cause the bet details to be filled in for a make order.
  That is 1 cent for the amount, "make" for the notes, and will put the
  focus on the odds field.
* Hitting "Escape" when the betslip is visible initiates a "Clear"
  click for the betslip. This makes dismissing the betslip much faster.
* A button that closes all open sportsbook sites when clicked.
* The ability to quickly add bookmarks to specific plays filtering
  on the Plays and Bet Market Details pages.
* Each chip containing the edge of a play is augmented with the Maximum
  Effective Growth or MEG calculation of the bet in basis points. See
  [But How Much Did You Lose?](https://amzn.to/4gvlGiw)
  for details on the calculation.
* Displays a counting timer for the number of seconds since the plays page
  was loaded. This gives a quick indicator on the staleness of the data.
* Plays a notification chime when the plays page contains plays. This is a
  quick heads up to take a closer look at the page.
* The ability to export and import your settings. (This is helpful because
  this extension isn't in the Chrome Web Store and thus can't sync settings
  via that mechanism.)

## Why isn't this in the Chrome Web Store?

Well, as Google explains it:

> We don't allow content or services that facilitate online gambling,
> including but not limited to online casinos, sports betting, lotteries,
> or games of skill that offer prizes of cash or other value.

Bummer, huh?

## OK, it isn't in the Chrome Web Store, so how do I install it?

* First you must be running the Chrome browser to use this Chrome extension.
* Second, you must put your browser into Developer mode. Click on the triple
  dots -> Extensions -> Manage Extensions. Toggle Developer mode in the
  upper right.
* Download the extension to your local disk. There are a couple of ways to do this:
  * If you are a git and github user, you can check out the project using git.
  * If you don't know how to use git, click <> Code -> Download ZIP above and
    unpack the ZIP file.
* Under Manage Extensions, click Load unpacked, and select the src/ directory
  from your downloaded extension.
* Make sure you have enabled the extension.

## What do I do if the extension breaks?

If you find the extension is not working correctly or is interfering with
8rain Station in some way it is likely because 8rain Station has been
updated in a way that broke the extension. In this case disable the
extension and notify me, davidburger@gmail.com.

## How can I support the author?

If you like the software and find it useful, you can do a few things to
support the author.

* Sign up for [8rain Station](https://8rainstation.com/) using the affiliate
  link "BURGER"
* Make a paypal donation to the author to davidburger@gmail.com
* Make a bitcoin donation to the author at bc1qk2d4h9rs9f26ylpctst5yv6jmgwk89e96wuenw
* Buy the author a beer
* Pay the author to write a custom Chrome extension
* When you sign up for sportsbooks use my referral code:
   * Novig - https://share.novig.us/davidburger

