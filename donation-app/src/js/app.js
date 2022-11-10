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
            campaignCard.find('.card-target').text(`Target : ${data[i]['target']} ETH`);
            campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['amount_raised']);
            campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
            campaignCard.find('.progress-bar').attr('style',`width: ${1+data[i]['amount_raised']*100/data[i]['target']}%;`);
            campaignCard.find('.progress-bar').text(data[i]['amount_raised']);
            campaignCard.find('.btn-donate').attr('data-id', data[i].id);
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
            console.log(data);  
            var campaignRows = $('#campaignRows');
            var campaignCardTemplate = $('#campaignCard');

            for (i = 0; i < 2; i ++) {
              var campaignCard = campaignCardTemplate;
              campaignCard.find('.card-title').text(data[i].title);
              campaignCard.find('.card-description').text(data[i].description);
              campaignCard.find('.card-target').text(`Target : ${data[i]['target']} ETH`);
              campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['amount_raised']);
              campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
              campaignCard.find('.progress-bar').attr('style',`width: ${1+data[i]['amount_raised']*100/data[i]['target']}%;`);
              campaignCard.find('.progress-bar').text(data[i]['amount_raised']);
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
    } else if(window.location.href.includes('/campaigns/donated')){
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
              campaignCard.find('.card-target').text(`Target : ${data[i]['target']} ETH`);
              campaignCard.find('.card-donation').text(`Donated : ${data[i]['amount_donated']} ETH`);
              campaignCard.find('.progress-bar').attr('aria-valuenow',data[i]['amount_raised']);
              campaignCard.find('.progress-bar').attr('aria-valuemax',data[i]['target']);
              campaignCard.find('.progress-bar').attr('style',`width: ${5+data[i]['amount_raised']*100/data[i]['target']}%;`);
              campaignCard.find('.progress-bar').text(data[i]['amount_raised']);
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
    $("form").submit(App.handleCreateCampaign);
  },

  handleDonation: function(event) {
    event.preventDefault();
    var campaignId = parseInt($(event.target).data('id'));
    var amount = parseInt(event.target.previousElementSibling.value);
    var donationsInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;

        event = donationsInstance.donate(campaignId, {from: account, value: amount*1e18});
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
                      "donatedBy": donationEvent['_from'],
                      "amount": parseInt(donationEvent['_value'])/1e18,
                    })
                  })
                  .then(resp => console.log(resp));
                  if (result.logs[1] != null){
                    var stateTransition = result.logs[1].args;

                    fetch('http://localhost:3000/campaigns/update',{
                      method: "POST",
                      headers:{'content-type': 'application/json'},
                      body: JSON.stringify({
                        "campaignId": parseInt(stateTransition['campaignId']),
                        "state": parseInt(stateTransition['state'])
                      })
                    })
                    .then(resp => console.log(resp));
                  }

                  alert(account + " donation done successfully");
                }
                
                else
                alert(account + " donation not done successfully due to revert")
            } else {
                alert(account + " donation failed")
            }   
        });
    });
  },

  handleCreateCampaign: function(event) {
    event.preventDefault();
    // var campaignId = parseInt($(event.target).data('id'));
    // var amount = parseInt(event.target.previousElementSibling.value);
    // var donationsInstance;
    var ta1=parseInt($('#target').val());
    var de=parseInt($('#deposit').val());
    var desc=$('#description').val();
    
    //de1=de.toString();
    //console.log(ta1);
    fetch(`${App.backendUrl}/query/campaigns/add`,{
      method: "POST",
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify({
        "description": desc,
        "amountRequired": ta1,
        "deposit": de,
      })
    })
    
    alert("Campaign has been created.");
    location.href = `${App.backendUrl}/mycampaigns`;
    
  },

  handleExpiry: function(event) {
    event.preventDefault();
    var campaignId = parseInt($(event.target).data('id'));
    var donationsInstance;

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.donations.deployed().then(function(instance) {
        donationsInstance = instance;
        const donations = [];
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

                  var eventArgs = result.logs[0].args;

                  // fetch('http://localhost:3000/donations/add',{
                  //   method: "POST",
                  //   headers:{'content-type': 'application/json'},
                  //   body: JSON.stringify({
                  //     "campaignId": parseInt(eventArgs['campaignId']),
                  //     "donatedBy": eventArgs['_from'],
                  //     "amount": parseInt(eventArgs['_value'])/1e18,
                  //   })
                  // })
                  // .then(resp => console.log(resp));

                  alert(account + " Refunds done successfully");
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
