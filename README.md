# magsearch #

Search for magnet files in terminal.


## Install ##
```
npm install -g magsearch
```

## Flags ##

Use "-s" to choose the site to scrap.
Options are "btd", "tpb", and "opb".
  
Use "-p" to choose page. (default is 1)

Use "-k" to narrow search. This is only available with "tpb" and "opb".
Options are "video", "audio", "applications", and "adult". (default is "all")
  ```
magsearch "schubert" -s tpb -k audio
  ```
  
  In case your feeling lucky use "-F"
  ```
magsearch "schubert" -F
  ```

## License ##
####MIT####
