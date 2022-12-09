App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  backendUrl: 'http://localhost:3000',
  chairPerson:null,
  currentAccount:null,
  init: function() {
    App.initWeb3();

    web3.eth.getAccounts(function(error, accounts) {

      fetch(`${App.backendUrl}/query/airdrop/check?address=${accounts[0]}`)
          .then(resp => resp.json())
          .then(data => {
            if(!data['isPresent']){
              $('#airdrop').append(
                '<a type="button" id="test" class="btn btn-success btn-airdrop btn-lg mx-5 px-5" href="#" style="float:right;">Get Free DTC</a>'
              );
              $('#airdrop').attr('style','height:60px;');
            }
          });
    });

    if (window.location.href.endsWith('/campaigns')){
      fetch(`${App.backendUrl}/query/campaigns/open`)
        .then(resp => resp.json())
        .then(data => {
          console.log(data);  
          var campaignRows = $('#campaignRows');
          var campaignCard = $('#campaignCard');

          for (i = 0; i < data.length; i ++) {
            campaignCard.find('.card-title').text(data[i].title);
            campaignCard.find('.card-description').text(data[i].description);
            campaignCard.find('.card-target').text(`Target : ${data[i]['target']} DTC`);
            campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['funds_raised']);
            campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
            var width = data[i]['funds_raised']*100/data[i]['target']
            if (width != 0) width+=5
            campaignCard.find('.progress-bar').attr('style',`width: ${width}%;`);
            campaignCard.find('.progress-bar').text(data[i]['funds_raised']);
            campaignCard.find('.btn-donate').attr('data-id', data[i].id);
            campaignCard.find('.btn-donatedtc').attr('data-id', data[i].id);
            campaignRows.append(campaignCard.html());
            App.names.push(data[i].name);
          }
        });
    } else if (window.location.href.includes('/mycampaigns')){

        web3.eth.getAccounts(function(error, accounts) {
          var createdBy = accounts[0];
          fetch(`${App.backendUrl}/query/campaigns/created?createdBy=${createdBy}`)
          .then(resp => resp.json())
          .then(data => {
            var campaignRows = $('#campaignRows');
            var campaignCardTemplate = $('#campaignCard');

            for (i = 0; i < data.length; i ++) {
              var campaignCard = campaignCardTemplate;
              campaignCard.find('.card-title').text(data[i].title);
              campaignCard.find('.card-description').text(data[i].description);
              campaignCard.find('.card-target').text(`Target : ${data[i]['target']} DTC`);
              campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['funds_raised']);
              campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
              var width = data[i]['funds_raised']*100/data[i]['target']
              if (width != 0) width+=5
              campaignCard.find('.progress-bar').attr('style',`width: ${width}%;`);
              campaignCard.find('.progress-bar').text(data[i]['funds_raised']);
              var status = data[i]['status'];
              campaignCard.find('.card-status').text(`Status : ${status}`);
              campaignCard.find('.btn-expire').attr('data-id', data[i].id);
              if (status.localeCompare('OPEN') == 0){
                campaignCard.find('.btn-expire').attr('style','');
              }else{
                campaignCard.find('.btn-expire').attr('style','display: none;');
              }
              campaignRows.append(campaignCard.html());
              App.names.push(data[i].name);
            }
          });
        });
    } else if(window.location.href.includes('/donations')){
        web3.eth.getAccounts(function(error, accounts) {
          var donatedBy = accounts[0];
    
          fetch(`${App.backendUrl}/query/campaigns/donated?donatedBy=${donatedBy}`)
          .then(resp => resp.json())
          .then(data => {
            console.log(data);  
            var campaignRows = $('#campaignRows');
            var campaignCard = $('#campaignCard');
    
            for (i = 0; i < data.length; i ++) {
              campaignCard.find('.card-title').text(data[i]['title']);
              campaignCard.find('.card-description').text(data[i]['description']);
              campaignCard.find('.card-target').text(`Target : ${data[i]['target']} DTC`);
              campaignCard.find('.card-donation').text(`Donated : ${data[i]['amount_donated']} DTC`);
              campaignCard.find('.card-status').text(`Status : ${data[i]['status']}`);
              campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['funds_raised']);
              campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
              var width = data[i]['funds_raised']*100/data[i]['target']
              if (width != 0) width+=5
              campaignCard.find('.progress-bar').attr('style',`width: ${width}%;`);
              campaignCard.find('.progress-bar').text(data[i]['funds_raised']);
              campaignRows.append(campaignCard.html());
              App.names.push(data[i].name);
            }
          });
        });
    }
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    return App.initContract();
  },

  initContract: function() {
      $.getJSON('Donations.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var donationsArtifact = data;
    App.contracts.donations = TruffleContract(donationsArtifact);

    // Set the provider for our contract
    App.contracts.donations.setProvider(App.web3Provider);
    
    return App.bindEvents();
  });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-donate', App.handleDonation);
    $(document).on('click', '.btn-expire', App.handleExpiry);
    $(document).on('click', '.btn-donatedtc', App.handleDonationDTC);
    $(document).on('click', '.btn-airdrop', App.handleGetDTC);
    $(document).on('click', '.btn-balancedtc', App.handleBalanceDTC);
    $("form").submit(App.handleCreateCampaign);
  },

  handleGetDTC: function(event) {
    event.preventDefault();
    var donationsInstance;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      fetch(`${App.backendUrl}/query/airdrop/add`,{
        method: "POST",
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify({
          "address": account
        })
      }).then(response => {
        if (response.ok) {
          App.contracts.donations.deployed().then(function(instance) {
            donationsInstance = instance;
            event = donationsInstance.getBalance({from: account});
            return event;
          }).then(function(result, err){
                if(result){
                  alert("Received 20 free DTC ");
                  location.href = `${App.backendUrl}/campaigns`;
                } else {
                    alert("receiveing DTC failed")
                }   
            });
        }else{
          alert("receiveing DTC failed")
        }
      });
    });
  },

  handleBalanceDTC: function(event) {
    event.preventDefault();
    var donationsInstance;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;
        event = donationsInstance.balanceOf(account,{from:account});
        return event;
      }).then(function(result, err){
            if(result ){
                alert("You Have "+parseInt(result)+" DTC");
            } else {
                alert("Failed to fetch DTC Balance");
            }   
        });
    });
  },

  handleCreateCampaign: function(event) {
    event.preventDefault();
    var donationsInstance;
    var target=$('#target').val();
    var desc=$('#description').val();
    var title=$('#title').val();
    var vendor=$('#vendor').val();

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;
        return donationsInstance.createCampaign(target, vendor, {from: account});
      }).then(function(result, err){
          if(result){
                console.log(result.logs);
                console.log(result.receipt.status);
                if(result.receipt.status == true){   
                  console.log("hello");
                  var campaignEvent = result.logs[0].args;
                  fetch(`${App.backendUrl}/query/campaigns/add`,{
                    method: "POST",
                    headers:{'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      "campaignId": parseInt(campaignEvent['campaignId']),
                      "createdBy":campaignEvent['createdBy'],
                      "vendor":campaignEvent['vendor'],
                      "title": title,
                      "description": desc,
                      "target": parseInt(campaignEvent['target']),
                      "deposit": parseInt(campaignEvent['deposit']),
                    })
                  })
                  .then(resp => console.log(resp));
                  
                  alert(account + " Campaign created successfully");
                  location.href = `${App.backendUrl}/mycampaigns`;
                }
                else
                alert(account + " Campaign creation failed due to revert")
            } else {
               alert(account + " Campaign creation failed")
            }   
        });
    });

  },
  handleDonationDTC: function(event) {
    event.preventDefault();
    var campaignId = parseInt($(event.target).data('id'));
    var amount = parseInt(event.target.previousElementSibling.value);
    var tokens=$('#tokenamount').val();
    var donationsInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;
        //event = donationsInstance.donate(campaignId, {from: account, value: amount*1e18});
        event = donationsInstance.donate(campaignId,tokens,{from: account});
        return event;
      }).then(function(result, err){
            if(result){
                console.log(result.logs);
                console.log(result.receipt.status);
                if(result.receipt.status == true){   

                  var donationEvent = result.logs[0].args;

                  fetch(`${App.backendUrl}/query/donations/add`,{
                    method: "POST",
                    headers:{'content-type': 'application/json'},
                    body: JSON.stringify({
                      "campaignId": parseInt(donationEvent['campaignId']),
                      "donatedBy": donationEvent['from'],
                      "amount": parseInt(donationEvent['numTokens']),
                      //"amount": tokens,
                    })
                  })
                  .then(resp => console.log(resp));
                  if (result.logs[1] != null){
                    var transition = result.logs[1].args;
                    status_list = ["OPEN","CLOSED","EXPIRED"];

                    fetch('http://localhost:3000/query/campaigns/update',{
                      method: "POST",
                      headers:{'content-type': 'application/json'},
                      body: JSON.stringify({
                        "campaignId": parseInt(transition['campaignId']),
                        "status": status_list[parseInt(transition['status'])]
                      })
                    })
                    .then(resp => console.log(resp));
                  }

                  alert(account + " donation done successfully");
                  location.href = `${App.backendUrl}/donations`;
                }
                
                else
                alert(account + " donation not done successfully due to revert")
            } else {
                alert(account + " donation failed")
            }   
        });
    });
  },




  handleExpiry: function(event) {
    event.preventDefault();
    var campaignId = parseInt($(event.target).data('id'));
    var donationsInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;
        var donations = [];
        fetch(`${App.backendUrl}/query/donations?campaignId=${campaignId}`)
        .then(resp => resp.json())
        .then(data => {
          for (var i=0;i<data.length;i++){
            donations.push([data[i]["donated_by"],data[i]["amount"]]);
          }

          donationsInstance.expireCampaign(campaignId, donations,{from: account}).then(function(result, err){
            if(result){
                console.log(result.logs);
                console.log(result.receipt.status);
                if(result.receipt.status == true){   

                  var transition = result.logs[0].args;
                  status_list = ["OPEN","CLOSED","EXPIRED"];

                  fetch('http://localhost:3000/query/campaigns/update',{
                    method: "POST",
                    headers:{'content-type': 'application/json'},
                    body: JSON.stringify({
                      "campaignId": parseInt(transition['campaignId']),
                      "status": status_list[parseInt(transition['status'])]
                    })
                  })
                  .then(resp => console.log(resp));
                  alert(account + " Refunds done successfully");
                  location.href = `${App.backendUrl}/mycampaigns`;
                }
                
                else
                alert(account + " Refunds not done successfully due to revert")
            } else {
                alert(account + " Refunds failed")
            }   
        });
        });

      })
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
