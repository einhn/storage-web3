output "instance_id" {
  value       = aws_instance.main.id
  description = "ID of the storage-web3 EC2 instance"
}

output "public_ip" {
  value       = aws_instance.main.public_ip
  description = "Public IP address of the instance"
}

output "public_dns" {
  value       = aws_instance.main.public_dns
  description = "Public DNS of the instance"
}