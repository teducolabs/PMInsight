# Use official .NET SDK for build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["PMInsight.Api/PMInsight.Api.csproj", "PMInsight.Api/"]
COPY ["PMInsight.Application/PMInsight.Application.csproj", "PMInsight.Application/"]
COPY ["PMInsight.Domain/PMInsight.Domain.csproj", "PMInsight.Domain/"]
COPY ["PMInsight.Infrastructure/PMInsight.Infrastructure.csproj", "PMInsight.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "PMInsight.Api/PMInsight.Api.csproj"

# Copy source code
COPY . .

# Build
WORKDIR "/src/PMInsight.Api"
RUN dotnet build "PMInsight.Api.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "PMInsight.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PMInsight.Api.dll"]
